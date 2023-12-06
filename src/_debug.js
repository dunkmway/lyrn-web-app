import Dialog from "./_Dialog";

export {
    showDebugData
}

function initialize() {
    // set the debug css as a link in the header
    const styles = document.createElement('link');
    styles.rel = "stylesheet";
    styles.href = "/styles/_debug.css"

    document.head.append(styles);
}

initialize();

function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function showDebugData(data) {
    const dataStr = JSON.stringify(data, null, 2)
    const pretty = syntaxHighlight(dataStr);
    const message = document.createElement('pre');
    message.innerHTML = pretty;

    Dialog.alert(message, {
        backgroundColor: '#1E1E1E',
        choiceColor: '#F8F8F8',
        choicesBorderTop: '1px solid #414141',
        width: 'auto'
    });
}