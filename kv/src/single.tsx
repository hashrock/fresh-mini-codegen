/* eslint-disable @typescript-eslint/naming-convention */
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import React, { useCallback, useEffect, useState } from "react";
import { kvGet, KvKey, kvSet } from "./api";

type ValueType = "string" | "json" | "number";

interface valueCheckResult {
  isValid: boolean;
  reason: string;
}

interface PageSingleProps {
  selectedKey?: KvKey;
  isNewItem?: boolean;
  onSaveNewItem?: (key: KvKey, value: unknown) => void;
}
export function PageSingle(props: PageSingleProps) {
  const [selectedKey, setSelectedKey] = useState<KvKey | undefined>(
    props.selectedKey,
  );
  const [value, setValue] = useState<string | null>(null);
  const [isNewItem, setIsNewItem] = useState<boolean>(props.isNewItem || false);
  const [newKey, setNewKey] = useState<KvKey | undefined>(props.selectedKey);
  const [versionstamp, setVersionstamp] = useState<string | null>(null);
  interface Message {
    message: string;
    level: "success" | "info" | "error";
  }

  const [message, setMessage] = useState<Message | null>(null);
  const [valueType, setValueType] = useState<ValueType>("string");

  const isValidValueType = useCallback((value: unknown): valueCheckResult => {
    if (valueType === "string") {
      return {
        isValid: true,
        reason: "string is always valid",
      };
    }
    if (valueType === "number") {
      if (value === null || value === undefined) {
        return {
          isValid: false,
          reason: "number cannot be null",
        };
      }
      if (Number.isNaN(parseFloat(value as string))) {
        return {
          isValid: false,
          reason: "invalid number",
        };
      }
      return {
        isValid: true,
        reason: "OK",
      };
    }
    if (valueType === "json") {
      if (value === null) {
        return {
          isValid: false,
          reason: "json cannot be null",
        };
      }
      try {
        JSON.parse(value as string);
      } catch (e) {
        return {
          isValid: false,
          reason: "invalid json",
        };
      }
      return {
        isValid: true,
        reason: "OK",
      };
    }
    return {
      isValid: false,
      reason: "unknown valueType",
    };
  }, [valueType]);

  const eventHandler = useCallback((event: MessageEvent) => {
    const message = event.data; // The json data that the extension sent

    if (!selectedKey) {
      return;
    }

    switch (message.type) {
      case "getResult": {
        const value = message.result.value;
        let valueType: ValueType = "string";
        if (typeof value === "object") {
          valueType = "json";
          setValue(JSON.stringify(value, null, 2));
        } else if (typeof value === "number") {
          valueType = "number";
          setValue(String(value));
        } else {
          setValue(value);
        }
        setValueType(valueType);
        setVersionstamp(message.result.versionstamp);
        break;
      }
    }
  }, [selectedKey]);

  const eventUpdateHandler = useCallback((event: MessageEvent) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "setResult": {
        if (message.result === "OK") {
          setIsNewItem(false);
          setMessage({
            message: "The item set successfully : " + new Date(),
            level: "success",
          });
          if (newKey) {
            kvGet(newKey);
          }
          if (selectedKey) {
            kvGet(selectedKey);
          }
        }
        break;
      }
    }
  }, [selectedKey]);

  useEffect(() => {
    if (selectedKey) {
      kvGet(selectedKey);
    }
    window.addEventListener("message", eventUpdateHandler);
    window.addEventListener("message", eventHandler);

    return () => {
      window.removeEventListener("message", eventHandler);
      window.removeEventListener("message", eventUpdateHandler);
    };
  }, [selectedKey]);

  return (
    <div className="single__wrapper">
      <div className="label">Key</div>

      <div className="single__key">
        <textarea
          className="single__key__textarea"
          rows={1}
          value={JSON.stringify(selectedKey)}
          onChange={(e) => {
            const value = e.target.value;
            if (
              value.charAt(0) === "[" && value.charAt(value.length - 1) === "]"
            ) {
              return setNewKey(JSON.parse(value));
            }

            return setNewKey(e.target.value.split(","));
          }}
          readOnly={!isNewItem}
        />
      </div>
      {versionstamp && (
        <div>
          <div className="label">VersionStamp</div>
          <div className="single__versionstamp">{versionstamp}</div>
        </div>
      )}

      <div className="single__value">
        <div className="value-column">
          <div className="label">Value</div>
          <select
            className="single__value__type"
            onChange={(e) => {
              setValueType(e.target.value as ValueType);
            }}
            value={valueType}
          >
            <option value="string">string</option>
            <option value="json">json</option>
            <option value="number">number</option>
          </select>
        </div>
        <div className="single__value__wrapper">
          <textarea
            className="single__value__textarea"
            value={value || ""}
            onChange={(e) => {
              if (e.target.value !== value) {
                return setValue(e.target.value);
              }
            }}
          />
        </div>

        <div className="single__value-checker">
          {isValidValueType(value).isValid ? "" : (
            `❌ ${isValidValueType(value).reason}`
          )}
        </div>
      </div>
      <button
        className="single__update"
        onClick={() => {
          if (!newKey) {
            setMessage({ message: "Key is empty", level: "error" });
            return;
          }
          if (!value) {
            setMessage({ message: "Value is empty", level: "error" });
            return;
          }
          if (!isValidValueType(value).isValid) {
            setMessage({
              message: isValidValueType(value).reason,
              level: "error",
            });
            return;
          }

          setSelectedKey(newKey);
          if (valueType === "string") {
            kvSet(newKey, value);
          } else if (valueType === "number") {
            kvSet(newKey, Number(value));
          } else if (valueType === "json" && value) {
            kvSet(newKey, JSON.parse(value));
          }
        }}
      >
        {isNewItem ? "Create" : "Update"}
      </button>
      {message && (
        <div className={`message message--${message.level}`}>
          <div className="label">{message?.message}</div>
        </div>
      )}
    </div>
  );
}
