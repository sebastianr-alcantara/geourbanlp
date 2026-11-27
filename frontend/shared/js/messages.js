(() => {
    const kinds = {
        info: {title: "Información", symbol: "i"},
        success: {title: "Éxito", symbol: "✓"},
        warning: {title: "Advertencia", symbol: "!"},
        error: {title: "Error", symbol: "×"}
    };
    let pendingDialog = Promise.resolve();
    let notificationRegion;

    function getKind(type) {
        if (!Object.hasOwn(kinds, type)) {
            throw new RangeError(`Tipo de mensaje desconocido: ${type}`);
        }
        return kinds[type];
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) {
            node.textContent = text;
        }
        return node;
    }

    function content(message, type, title) {
        const kind = getKind(type);
        const wrapper = element("div", "message-content");
        const icon = element("span", `message-icon message-icon--${type}`, kind.symbol);
        icon.setAttribute("aria-hidden", "true");
        const copy = element("div", "message-copy");
        const heading = element("h2", "message-title", title ?? kind.title);
        const description = element("p", "message-description", message);
        copy.append(heading, description);
        wrapper.append(icon, copy);
        return {wrapper, heading, description};
    }

    function showDialog(message, options, confirmation) {
        const type = options.type ?? (confirmation ? "warning" : "info");
        const parts = content(message, type, options.title);
        const dialog = element("dialog", "message-dialog");
        dialog.setAttribute("aria-labelledby", "message-dialog-title");
        dialog.setAttribute("aria-describedby", "message-dialog-description");
        parts.heading.id = "message-dialog-title";
        parts.description.id = "message-dialog-description";
        dialog.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                event.preventDefault();
                dialog.close("cancel");
            }
        });
        const actions = element("div", "message-actions");
        const accept = element("button", "message-button message-button--primary", options.confirmText ?? "Aceptar");
        accept.type = "button";
        accept.addEventListener("click", () => dialog.close("accept"));
        if (confirmation) {
            const cancel = element("button", "message-button message-button--secondary", options.cancelText ?? "Cancelar");
            cancel.type = "button";
            cancel.autofocus = true;
            cancel.addEventListener("click", () => dialog.close("cancel"));
            actions.append(cancel);
        } else {
            accept.autofocus = true;
        }
        actions.append(accept);
        dialog.append(parts.wrapper, actions);

        return new Promise((resolve, reject) => {
            dialog.addEventListener("close", () => {
                const accepted = dialog.returnValue === "accept";
                dialog.remove();
                resolve(confirmation ? accepted : undefined);
            }, {once: true});
            document.body.append(dialog);
            try {
                dialog.showModal();
            } catch (error) {
                dialog.remove();
                reject(error);
            }
        });
    }

    function queueDialog(message, options, confirmation) {
        const result = pendingDialog.then(() => showDialog(message, options, confirmation));
        pendingDialog = result.then(() => undefined, () => undefined);
        return result;
    }

    function notify(message, options = {}) {
        const type = options.type ?? "info";
        const duration = options.duration ?? 5000;
        if (!Number.isFinite(duration) || duration < 0) {
            throw new RangeError("La duración debe ser un número no negativo.");
        }
        const parts = content(message, type, options.title);
        if (!notificationRegion || !notificationRegion.isConnected) {
            notificationRegion = element("div", "message-notifications");
            notificationRegion.setAttribute("aria-live", "polite");
            notificationRegion.setAttribute("aria-relevant", "additions");
            document.body.append(notificationRegion);
        }
        const notification = element("div", "message-notification");
        const dismiss = element("button", "message-dismiss", "×");
        dismiss.type = "button";
        dismiss.setAttribute("aria-label", "Cerrar notificación");
        notification.append(parts.wrapper, dismiss);
        notificationRegion.append(notification);
        let timer;
        function close() {
            clearTimeout(timer);
            notification.remove();
        }
        dismiss.addEventListener("click", close);
        if (duration > 0) {
            timer = setTimeout(close, duration);
        }
        return close;
    }

    window.GeoMessages = {
        alert: (message, options = {}) => queueDialog(message, options, false),
        confirm: (message, options = {}) => queueDialog(message, options, true),
        notify
    };
})();