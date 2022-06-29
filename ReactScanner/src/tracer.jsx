let _userIP = "";
let _userIPApi = "https://ipgeolocation.abstractapi.com/v1/";
let _userIPApiKey = "de8a4390b3514c089e56c67413aee03f";

async function getUserIP() {
    if (!_userIP) {
        const response = await fetch(_userIPApi + "?api_key=" + _userIPApiKey);
        const json = await response.json();
        _userIP = json.ip_address;
    }
    return _userIP;
}

const trace = (event) => {
    getUserIP().then(
        () => {
            let traces = buildTrace(event);
            console.info(traces);
        },
        (err) => {
            console.error(`Failed to fetch user IP`);
        }
    );
};

async function buildTrace(event) {
    let trace = "Timestamp: " + getTraceWhen() + ", ";
    trace += "Widget: (" + getTraceWhere(event.target) + ")" + ", ";
    trace += "User IP: " + (await getUserIP());
    trace += "Event: " + getTraceWhat(event) + ", ";
    console.log(trace);
    return trace;
}

function getTraceWhen() {
    return new Date().toUTCString();
}

function getTraceWho() {
    return getUserIP();
}

function getTraceWhat(event) {
    return event.type;
}

function getTraceWhere(target) {
    let widgetTrace = "Tag: " + target.tagName + ", ";
    widgetTrace += "ID: " + getWidgetID(target) + ", ";
    widgetTrace += "XPath: " + getXPath(target, "");
    switch (target.tagName) {
        case "INPUT":
            widgetTrace += ", " + getTraceInput(target);
            break;

        case "TEXTAREA":
            widgetTrace += ", " + getTraceTextArea(target);
            break;

        case "SELECT":
            widgetTrace += ", " + getTraceSelect(target);
            break;
    }

    return widgetTrace;
}

function getTraceInput(input) {
    let type = input.getAttribute("type");
    let inputTrace = "Type: " + type + ", ";
    switch (type) {
        case "text":
            inputTrace += "Entered Text Value: " + input.value;
            break;

        case "password":
            inputTrace += "Entered Password Value: N/A (Password placeholder)";
            break;

        case "email":
            inputTrace += "Entered Email Value: " + input.value;
            break;

        case "tel":
            inputTrace += "Entered Telephone Value: " + input.value;
            break;

        case "search":
            inputTrace += "Entered Searched Value: " + input.value;
            break;

        case "date":
            inputTrace +=
                "Entered Date Value: " + new Date(input.value).toLocaleDateString();
            break;

        case "dateTime-local":
            inputTrace +=
                "Entered Local Date-Time Value: " +
                new Date(input.value).toLocaleString();
            break;

        case "time":
            inputTrace += "Entered Time Value: " + input.value;
            break;

        case "month":
            inputTrace += "Entered Month Value: " + input.value;
            break;

        case "week":
            inputTrace += "Entered Week Value: " + input.value;
            break;

        case "number":
            inputTrace += "Entered Number Value: " + input.value;
            break;

        case "range":
            let min = input.getAttribute("min") || "0";
            let max = input.getAttribute("max") || "100";
            inputTrace += "Entered Range [" + min + ", " + max + "]: " + input.value;
            break;

        case "color":
            inputTrace += "Entered Color Value: " + input.value;
            break;

        case "file":
            inputTrace += "Uploaded File Path: " + input.value;
            break;

        case "checkbox":
            inputTrace += "Checked Value: " + (input.checked ? input.value : "off");
            break;

        case "radio":
            inputTrace += "Chosen Value: " + input.value;
            break;
    }

    return inputTrace;
}

function getTraceTextArea(textArea) {
    return "Entered Value: " + textArea.value;
}

function getTraceSelect(select) {
    return "Chosen Option: " + select.value;
}

function getWidgetID(element) {
    let widgetID = element.id;

    if (!widgetID) widgetID = getDefaultWidgetID(element);

    return widgetID;
}

function getDefaultWidgetID(element) {
    return getTextOfFirstNonEmptyChild(element);
}

function getTextOfFirstNonEmptyChild(element) {
    let text = "";
    for (let child of Array.from(element.childNodes)) {
        text = child.textContent.replace(/[\\n\\r]+|[\\s]{2,}/g, " ").trim();

        if (text.length > 0) break;
    }

    if (text.length == 0 && element.parentElement)
        return getTextOfFirstNonEmptyChild(element.parentElement);

    return text;
}

function getXPath(element, current) {
    let childTag = element.tagName.toLowerCase();
    if (childTag == "html") return "/html[1]" + current;

    let count = 0;
    let parent = element.parentElement;
    let children = parent.children;
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        if (child.nodeType === 1 && child.tagName.toLowerCase() === childTag)
            count++;
        if (child === element)
            return getXPath(parent, "/" + childTag + "[" + count + "]" + current);
    }
}

export {
    trace,
    getTraceWhere,
    getTraceWhat,
    getTraceWhen,
    getTraceWho,
    getUserIP,
    buildTrace,
};
