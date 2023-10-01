/* eslint-disable @typescript-eslint/naming-convention */
//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
  // @ts-ignore
  const vscode = acquireVsCodeApi();

  const oldState = vscode.getState() || { colors: [] };

  /** @type {Array<{ value: string }>} */
  let colors = oldState.colors;

  // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
      case "setRoutes": {
        const routes = message.value;
        updateRoutes(routes);
        break;
      }
    }
  });

  /**
   * @param {Array<{ route: string, file: string, pattern, string }>} routes
   */
  function updateRoutes(routes) {
    const ul = document.querySelector(".route-list");
    if (!ul) {
      return;
    }
    ul.textContent = "";
    for (const route of routes) {
      const cleanedRoute = route.route.replace(/^routes\//, "");

      const li = document.createElement("li");
      li.className = "route-entry";

      // Special routes:
      // _app
      // _layout
      // _middleware
      // _404
      // _500

      const routeTypeMatcher = [
        {
          fileName: "_app.tsx",
          name: "App Wrapper",
          shortName: "App",
          document: "https://fresh.deno.dev/docs/concepts/app-wrapper",
        },
        {
          fileName: "_layout.tsx",
          name: "Layout",
          shortName: "Layout",
          document: "https://fresh.deno.dev/docs/concepts/layouts",
        },
        {
          fileName: "_middleware.ts",
          name: "Middleware",
          shortName: "Middleware",
          document: "https://fresh.deno.dev/docs/concepts/middleware",
        },
        {
          fileName: "_404.tsx",
          name: "Error page",
          shortName: "Error",
          document: "https://fresh.deno.dev/docs/concepts/error-pages",
        },
        {
          fileName: "_500.tsx",
          name: "Error page",
          shortName: "Error",
          document: "https://fresh.deno.dev/docs/concepts/error-pages",
        },
      ];

      const matched = routeTypeMatcher.find((matcher) =>
        route.file.endsWith(matcher.fileName)
      ) || {
        name: "Route",
        shortName: "Route",
        document: "https://fresh.deno.dev/docs/concepts/routing",
      };

      const routeName = document.createElement("div");
      routeName.className = "route-name";
      li.appendChild(routeName);

      routeName.appendChild(createRouteIcon());

      const routeNameLabel = document.createElement("div");
      routeNameLabel.className = "route-label";
      routeNameLabel.textContent = cleanedRoute;
      routeName.appendChild(routeNameLabel);

      const routeAction = document.createElement("div");
      routeAction.className = "route-action";
      li.appendChild(routeAction);

      // Document
      routeAction.appendChild(
        createPreviewLink(matched.name, matched.document),
      );

      if (matched.shortName === "Route") {
        routeAction.appendChild(
          createPreviewLink("Preview", `http://localhost:8000/${cleanedRoute}`),
        );
      }

      const routeEdit = document.createElement("div");
      routeEdit.className = "route-edit";
      routeEdit.textContent = "Edit";

      routeAction.appendChild(routeEdit);

      ul.appendChild(li);
    }

    /**
     * @param {string} name
     * @param {string} href
     */
    function createPreviewLink(name, href) {
      const fileLink = document.createElement("a");
      fileLink.className = "file-link";
      fileLink.textContent = name;
      fileLink.href = href;
      return fileLink;
    }
  }

  function createRouteIcon() {
    const icon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    icon.setAttribute("width", "24");
    icon.setAttribute("height", "25");
    icon.setAttribute("viewBox", "0 0 24 25");
    icon.classList.add("icon");

    const useTag = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "use",
    );
    useTag.setAttributeNS(
      "http://www.w3.org/1999/xlink",
      "href",
      "#icon-path",
    );
    icon.appendChild(useTag);
    return icon;
  }

  vscode.postMessage({ type: "update" });
})();