(() => {
    const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
    };

    function escape(value, apostrophe) {
        return String(value).replace(/[&<>"']/g, character =>
            character === "'" ? apostrophe : entities[character]
        );
    }

    window.GeoMarkup = {
        escapeHtml: value => escape(value, "&#39;"),
        escapeXml: value => escape(value, "&apos;")
    };
})();
