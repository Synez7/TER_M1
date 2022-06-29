import fse = require('fs-extra');
import path = require('path');
import glob = require('glob');
import { JSDOM } from "jsdom";
import { Project } from 'ts-morph';
import { v4 as uuidv4 } from 'uuid';
import * as readline from 'readline';
import { performance } from 'perf_hooks';


const project = new Project();

let instrumentedAppFolder: string = '';

const tracerConfigurationPath: string = 'resources/configuration/tracing_config.json';

const tracerPath = `../bl-gui-tracer/tracer`;

main();

function main() {
    let t1 = performance.now();
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

    rl.question('Please enter the absolute path to your React src/ folder : \r\n', (appPath) => {
      setInstrumentedAppFolder(appPath);

      t1 = performance.now();
      glob(instrumentedAppFolder + '/**/*.js', {}, (err, files) => {
            injectTracerDependency();
            files.forEach(file => {
                if(file.match(/\/src\/index.js|Context/g)){
                }
                else {
                    let componentTemplateWrapper = new ComponentTemplateWrapper(project, file);
                    componentTemplateWrapper.instrument();
                    componentTemplateWrapper.businessLogic.instrument();
                }
            });
            let t2 = performance.now();
            console.log(`Execution time = ${(t2-t1)/1000}s`);
        });

      rl.close();
    });
}

//Set le dossier source
function setInstrumentedAppFolder(appPath: string) {
    instrumentedAppFolder = appPath;
}

//Copie le fichier à l'emplacement souhaité
function injectTracerDependency(){
    let targetFolder = `${instrumentedAppFolder}${path.sep}bl-gui-tracer`;
    let tracerFile = 'tracer.jsx';

    if (!fse.existsSync(targetFolder))
        fse.mkdirSync(targetFolder);

    fse.copyFileSync(`${__dirname}${path.sep}${tracerFile}`, `${targetFolder}${path.sep}${tracerFile}`);
}


function isAlphaNumeric(str: string): boolean {
    for (let i = 0, len = str.length; i < len; i++) {
        let code = str.charCodeAt(i);
        if (!(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123)) // lower alpha (a-z)
            return false;
    }
    return true;
}

export class ComponentTemplateWrapper {

    private _project: Project;

    private _file: string;

    private _document: Document;

    private _html: string;

    private _widgetDictionary = {};

    private _businessLogic: ComponentBusinessLogicWrapper;

    private _requiresTracing = false;

    private readonly camelCaseRegex: RegExp = /.[a-z]+[A-Z]+[a-z]*(?:[A-Z][a-z]+)*/gm;

    private camelCaseWords: RegExpMatchArray;

    constructor(project: Project, file: string){
        this._project = project;
        this._file = file;
        this._html = fse.readFileSync(this._file,"utf-8");
        this._businessLogic = new ComponentBusinessLogicWrapper(this._project, this);
    }


    get project(){
        return this._project;
    }


    get file(){
        return this._file;
    }

    get document(){
        return this._document;
    }

    get html(){
        return this._html;
    }


    set html(html: string){
        this._html = html;
    }


    get widgetDictionary(){
        return this._widgetDictionary;
    }


    addWidgetToDictionary(widgetTag: string){
        if(this._widgetDictionary[widgetTag])
            this._widgetDictionary[widgetTag]++;
        else
            this._widgetDictionary[widgetTag] = 1;
    }


    get businessLogic(){
        return this._businessLogic;
    }

    get requiresTracing(){
        return this._requiresTracing;
    }


    set requiresTracing(requiresTracing: boolean){
        this._requiresTracing = requiresTracing;
    }

    replaceHTML(searchValue: string | RegExp, replaceValue: string){
        this._html = this._html.replace(searchValue, replaceValue);
    }


    instrument(configuration: ElementTracerConfiguration = new JSONElementTracerConfiguration(tracerConfigurationPath)){
        console.log(`Started instrumenting ${this._file}`);
        this.preProcess();
        this.process(configuration);
        this.postProcess();
        fse.writeFileSync(this._file, this._html);
        console.log(`Done instrumenting ${this._file}`);
        this._project.addSourceFileAtPath(this._file);
    }

    preProcess(){
        this.getCamelCaseAttributesAndValuesFromInitialHTML();
        this.replaceHTML(/%/g, '--pct--');
        this._html = decodeURIComponent(this._html);
        this.replaceHTML(/--pct--/g, '%');

        //Remplace " par ' pour eviter probleme de detection de valeur d'attribut
        this.replaceHTML(/"/g,"\'");

        //Transformation élément JSX en élément HTML
        this.replaceHTML(/as={NavLink}/gm,"as='{NavLink}'");

        //Transforme début élément type JSX ={ en élément HTML ="{
        this.replaceHTML(/=\{/gm,"=\"{");

        //Transforme fin d'élément JSX (fonction ou objet) en HTML
        this.replaceHTML(/}}/gm,"}}\"");

        // Transform fin d'élément JSX en HTML
        this.replaceHTML(/}[\n\r\s]+>/gm,"}\">");

        //Transforme <Link tag en HTML
        this.replaceHTML(/<Link/gm,"<linkholder");

        //Transforme <Link tag en HTML
        this.replaceHTML(/\/Link/gm,"/linkholder");

        //Transforme => en __ARROWSYMBOL__
        this.replaceHTML(/=>/gm,"__ARROWSYMBOL__");


        // this.replaceHTML(/<Nav.Link/gm,"<navlinkholder");
        // this.replaceHTML(/<Nav/gm,"<navholder");
        // this.replaceHTML(/<\/Nav.Link/gm,"</navlinkholder");




    }


    process(configuration: ElementTracerConfiguration){
        this.parseDOM();
        this.traceAndAssignIDsToElements(configuration);

    }


    postProcess(){
        this.stripFromUselessHTMLTags();
        this.replaceLowerCaseAttributesAndValuesByCamelCaseInFinalHTML();
        this.replaceHTML(/&amp;/gm,"&");
        this.replaceHTML(/&lt;/gm,"<");
        this.replaceHTML(/&gt;/gm,">");


        this.replaceHTML(/(?<=onClick|onChange=)"(?={.*}")|(?<=onClick|onChange="{.*})"/gm, "")
        this.replaceHTML(/(?<=on[A-Z]+.*="{\(\) __ARROWSYMBOL__ ){/gm,"{ trace(event);");
        this.replaceHTML(/(?<=<(input|img).*)>/gm, "/>")
        this.replaceHTML(/onClick="trace\(\);" /gm, "")
        this.replaceHTML(/(?<=on[A-Z]+.*="{\(\) __ARROWSYMBOL__ ){/gm,"{ trace(event);");

        this.replaceHTML(/"{/gm, "{")
        this.replaceHTML(/}"/gm, "}")
        this.replaceHTML(/<linkholder/gm,"<Link");
        this.replaceHTML(/\/linkholder/gm,"/Link");
        this.replaceHTML(/(?<=on[A-Z]+[a-z]*=)"(?=trace\(\);")/gm,"{");
        this.replaceHTML(/(?<=on[A-Z]+[a-z]*={trace\(\));"/gm,"}");
        this.replaceHTML(/nav.link/gm,"Nav.Link");
        this.replaceHTML(/nav/gm,"Nav");
        this.replaceHTML(/(?<=on[A-Z]+[a-z]*={)\(\)/gm,"(event)");
        this.replaceHTML(/trace\(event\); trace\(event\);/gm,"trace(event);");
        this.replaceHTML(/trace\(\)/gm,"trace");
        this.replaceHTML(/(?<=(id="INPUT).*)>/gm,"/>");
        this.replaceHTML(/__ARROWSYMBOL__/gm,"=>");

    }


    getCamelCaseAttributesAndValuesFromInitialHTML(){
        this.camelCaseWords = this._html.match(this.camelCaseRegex);

        if (this.camelCaseWords){
            // Delete duplicates
            this.camelCaseWords = [...new Set(this.camelCaseWords)];
            // Sort the words in order to make sure longer words get converted
            this.camelCaseWords.sort((a, b) => b.length - a.length);
        }
    }

    parseDOM(){
        this._document = (new JSDOM(this._html)).window.document;
    }

    traceAndAssignIDsToElements(configuration: ElementTracerConfiguration){
        let elementWrapper: ElementWrapper,
            elementTracer: ElementTracer,
            elementIDGenerator: ElementIDGenerator;

        let allElements = Array.from(this._document.getElementsByTagName("*"));
            console.log(`# Elements: ${allElements.length}`);
            allElements.forEach((element) => {

                elementWrapper = new ElementWrapper(element, this);
                elementTracer = new ElementTracer(elementWrapper, configuration);
                elementWrapper.accept(elementTracer);

                elementIDGenerator = new ElementIDGenerator(elementWrapper, elementTracer);
                elementWrapper.accept(elementIDGenerator);
            });

        this._html = this._document.documentElement.outerHTML;
        elementTracer.postVisit();
    }

    stripFromUselessHTMLTags(){
        this.replaceHTML('<html><head></head><body>','');
        this.replaceHTML('</body></html>','');
    }

    replaceLowerCaseAttributesAndValuesByCamelCaseInFinalHTML(){
        if(this.camelCaseWords)
            this.camelCaseWords.forEach((word) => {
                let escapeFirstNonAlphaNumeric = (!isAlphaNumeric(word.charAt(0)))? "\\" : "";
                let lowerCaseWordRegex = new RegExp(escapeFirstNonAlphaNumeric + word.toLowerCase(), 'g');
                this.replaceHTML(lowerCaseWordRegex, word);
            });
    }
}


export class ComponentBusinessLogicWrapper{


    private _project: Project;

    private _file: string;


    private _template: ComponentTemplateWrapper;

    constructor(project: Project, template: ComponentTemplateWrapper){
        this._project = project;
        this._template = template;
        this._file = this._template.file;
    }

     get project(){
        return this._project;
    }

    get template(){
        return this._template;
    }

    get file(){
        return this._file;
    }

    instrument(){
        console.log(`Started instrumenting ${this._file} business logic side.` );
        let sourceFile = this._project.getSourceFile(this._file);
        if(this._template.requiresTracing){
            sourceFile.addImportDeclaration({
                defaultImport: "{trace}",
                moduleSpecifier: tracerPath,
            });
        }
        console.log(`Done instrumenting ${this._file} business logic side.`);
        this._project.saveSync();
    }
}

export class ElementWrapper {

    private _element: Element;

    private _containerTemplate: ComponentTemplateWrapper;

    constructor(element: Element, containerTemplate: ComponentTemplateWrapper){
        this._element = element;
        this._containerTemplate = containerTemplate;
    }

    get element(){
        return this._element;
    }

    get containerTemplate(){
        return this._containerTemplate;
    }

    get tag(){
        return this.element.tagName;
    }

    get id(){
        return this.element.id;
    }

    set id(id: string){
        this.element.id = id;
    }

    hasTag(tagName: string){
        return this.tag === tagName;
    }

    hasAttribute(attributeName: string){
        return this.element.getAttributeNames().includes(attributeName);
    }

    hasAttributeWithValue(attributeName: string, attributeValue: string){
        return this.getAttribute(attributeName) === attributeValue;
    }

    getAttribute(attributeName: string){
        return this.element.getAttribute(attributeName);
    }

    setAttribute(attributeName: string, attributeValue: string){
        this.element.setAttribute(attributeName, attributeValue);
    }

    removeAttribute(attributeName: string){
        this.element.removeAttribute(attributeName);
    }

    accept(visitor: ElementVisitor){
        visitor.visit();
    }

    isClickable(): boolean {
        return this.hasAttribute("onClick");
    }

    isRouterLinkable(): boolean {
        return this.hasAttribute("[routerlink]") || this.hasAttribute("routerlink");
    }

    isSubmitButton(): boolean {
        return (this.hasTag("BUTTON") || (this.hasTag("INPUT")))
            // && this.hasAttributeWithValue("type", "submit");
    }

    isButton(): boolean {
        return (this.hasTag("BUTTON") || this.hasTag("INPUT"))
            && this.hasAttributeWithValue("type", "button");
    }

    isForm(): boolean {
        return this.hasTag("FORM");
    }

    isSelect(): boolean {
        return this.hasTag("SELECT");
    }

    isTextArea(): boolean {
        return this.hasTag("TEXTAREA");
    }

    isNonRouterLinkableAnchor(): boolean {
        return this.hasAttribute("href")
            && !this.hasAttributeWithValue("href", "#");
    }

    isTextInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "text");
    }

    isPasswordInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "password")
    }

    isEmailInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "email")
    }

    isTelInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "tel")
    }

    isSearchInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "search")
    }

    isDateInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "date");
    }

    isLocalDateTimeInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "datetime-local");
    }

    isTimeInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "time");
    }

    isMonthInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "month");
    }

    isWeekInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "week");
    }

    isNumberInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "number");
    }

    isRangeInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "range");
    }

    isColorInput(): boolean {
        return this.hasTag("INPUT")
        && this.hasAttributeWithValue("type", "color");
    }

    isRadioInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "radio");
    }

    isCheckboxInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "checkbox");
    }

    isFileInput(): boolean {
        return this.hasTag("INPUT")
            && this.hasAttributeWithValue("type", "file");
    }
}


export abstract class ElementVisitor {

    protected _elementWrapper: ElementWrapper;

    constructor(elementWrapper: ElementWrapper){
        this._elementWrapper = elementWrapper;
    }

     get elementWrapper(){
        return this._elementWrapper;
    }

    abstract preVisit(): any;

    abstract visit(): any;

    abstract postVisit(): any;
}


export class ElementTracer extends ElementVisitor {

    private strategy: {};

    constructor(elementWrapper: ElementWrapper, configuration: ElementTracerConfiguration){
        super(elementWrapper);
        this.strategy = configuration.strategy;
    }

    preVisit(): boolean {
        return this.requiresTracing();
    }

    visit(): void {
        if (this.preVisit()){
            for(const property in this.strategy){
                if (this.strategy[property]){
                    this.traceElement(property);
                }
            }
        }
    }

    postVisit(){
        for(const property in this.strategy){
            if (this.strategy[property]){
                this.traceTemplate(property);
            }
        }
    }

    requiresTracing(): boolean {
        let tracingCondition: boolean = false;
        for(const property in this.strategy){
            if (this.strategy[property]){
                switch(property){
                    case 'click':
                        tracingCondition = tracingCondition || this.elementWrapper.isClickable() || this.elementWrapper.isButton();
                        break;

                    case 'ngSubmit':
                        tracingCondition = tracingCondition || this.elementWrapper.isSubmitButton() || this.elementWrapper.isForm();
                        break;

                    case 'routerLink':
                        tracingCondition = tracingCondition || this.elementWrapper.isRouterLinkable();
                        break;

                    case 'href':
                        tracingCondition = tracingCondition || this.elementWrapper.isNonRouterLinkableAnchor();
                        break;

                    case 'focusOut':
                        tracingCondition = tracingCondition || this.isMeaningfullyFocusable();
                        break;

                    case 'change':
                        tracingCondition = tracingCondition || this.isMeaningfullyChangeable() || this.elementWrapper.isColorInput();
                        break;

                    case 'file':
                        tracingCondition = tracingCondition || this.elementWrapper.isFileInput();
                        break;

                    default:
                        throw new Error("Unknown Tracing Configuration Option");
                }
            }
        }

        if (tracingCondition)
            this.elementWrapper.containerTemplate.requiresTracing = true;

        return tracingCondition;
    }

     isMeaningfullyFocusable(): boolean {
        return this.elementWrapper.isTextInput() || this.elementWrapper.isPasswordInput()
            || this.elementWrapper.isEmailInput() || this.elementWrapper.isTelInput()
            || this.elementWrapper.isSearchInput()|| this.elementWrapper.isTextArea()
            || this.elementWrapper.isDateInput() || this.elementWrapper.isLocalDateTimeInput()
            || this.elementWrapper.isTimeInput() || this.elementWrapper.isMonthInput()
            || this.elementWrapper.isWeekInput() ||  this.elementWrapper.isRangeInput()
            || this.elementWrapper.isColorInput();
    }

    isMeaningfullyChangeable(): boolean {
        return this.elementWrapper.isSelect()
        || this.elementWrapper.isCheckboxInput() || this.elementWrapper.isRadioInput()
        || this.elementWrapper.isNumberInput();
    }

    private traceElement(property: string): void {
        switch(property){
            case 'click':
                this.traceElementWithClickEvent();
                break;

            case 'ngSubmit':
                this.traceElementWithNgSubmitEvent();
                break;

            case 'routerLink':
                this.traceElementWithRouterlinkEvent();
                break;

            case 'href':
                this.traceElementWithHrefEvent();
                break;

            case 'focusOut':
                this.traceElementWithFocusOutEvent();
                break;

            case 'change':
                this.traceElementWithChangeEvent();
                break;

            case 'file':
                this.traceElementWithFileUploadEvent();
                break;

            default:
                throw new Error("Unknown Tracing Configuration Option");
        }
    }

    private traceElementWithExistingEvents(existingEvents: string[], newEventPlaceholders: string[], defaultEventPlaceholder?: string): void {
        let targetEvent = "", targetEventIndex = 0, eventHandler = "";
        for (let existingEvent of existingEvents){
            if (this.elementWrapper.hasAttribute(existingEvent)){
                targetEvent = existingEvent;
                targetEventIndex = existingEvents.indexOf(existingEvent);
                eventHandler = this.elementWrapper.getAttribute(existingEvent);
                this.elementWrapper.setAttribute(newEventPlaceholders[targetEventIndex], `trace(); ${eventHandler}`);
                this.elementWrapper.removeAttribute(existingEvent);
            }
        }

        if (!targetEvent){
            if (defaultEventPlaceholder)
                this.elementWrapper.setAttribute(defaultEventPlaceholder, "trace();")
            else
                newEventPlaceholders.forEach(placeholder => this.elementWrapper.setAttribute(placeholder, "trace();"));
        }

        this.elementWrapper.setAttribute("data-eventful-widget","true");
    }

    private traceElementWithClickEvent() {
        if (this.elementWrapper.isClickable() || this.elementWrapper.isButton()) {
            this.traceElementWithExistingEvents(['onClick'], ['click_event_added']);
        }
    }

    private traceElementWithNgSubmitEvent() {
        if (this.elementWrapper.isSubmitButton())
            this.elementWrapper.setAttribute('data-eventful-widget', 'true');

        else if (this.elementWrapper.isForm()) {
            this.traceElementWithExistingEvents(['onSubmit'], ['ngsubmit_event_added']);
            this.elementWrapper.removeAttribute('data-eventful-widget');
        }
    }

    private traceElementWithRouterlinkEvent() {
        if (this.elementWrapper.isRouterLinkable())
            this.traceElementWithExistingEvents(['onClick'], ['click_event_added']);
    }

    private traceElementWithHrefEvent() {
        if (this.elementWrapper.isNonRouterLinkableAnchor())
            this.traceElementWithExistingEvents(['onClick'], ['click_event_added']);
    }

    private traceElementWithFocusOutEvent() {
        if (this.isMeaningfullyFocusable())
            this.traceElementWithExistingEvents(['onBlur'], ['focusout_event_added']);
    }

    private traceElementWithChangeEvent() {
        if (this.isMeaningfullyChangeable())
            this.traceElementWithExistingEvents(['onChange', '(ngmodelchange)'], ['change_event_added', 'ngmodelchange_event_added'], 'change_event_added');
    }

    private traceElementWithFileUploadEvent() {
        if (this.elementWrapper.isFileInput())
            this.traceElementWithExistingEvents(['onChange'], ['file_upload_event_added']);
    }

    private traceTemplate(property: string): void {
        switch(property){
            case 'click':
                this.traceTemplateWithClickEventPlaceholders();
                break;

            case 'ngSubmit':
                this.traceTemplateWithNgSubmitEventPlaceholders();
                break;

            case 'routerLink':
                this.traceTemplateWithRouterlinkEventPlaceholders();
                break;

            case 'href':
                this.traceTemplateWithHrefEventPlaceholders();
                break;

            case 'focusOut':
                this.traceTemplateWithFocusOutEventPlaceholders();
                break;

            case 'change':
                this.traceTemplateWithChangeEventPlaceholders();
                break;

            case 'file':
                this.traceTemplateWithFileUploadEventPlaceholders();
                break;

            default:
                throw new Error("Unknown Tracing Configuration Option");
        }
    }

    private traceTemplateWithClickEventPlaceholders() {
        this.elementWrapper.containerTemplate.replaceHTML(
            /click_event_added/gm,
            "onClick"
        );
    }

    private traceTemplateWithNgSubmitEventPlaceholders() {
        this.elementWrapper.containerTemplate.replaceHTML(
            /ngsubmit_event_added/gm,
            "onSubmit"
        );
    }

    private traceTemplateWithRouterlinkEventPlaceholders() {
        this.elementWrapper.containerTemplate.replaceHTML(
            /click_event_added/gm,
            "onClick"
        );
    }

    private traceTemplateWithHrefEventPlaceholders() {
        this.elementWrapper.containerTemplate.replaceHTML(
            /click_event_added/gm,
            "onClick"
        );
    }

    private traceTemplateWithFocusOutEventPlaceholders() {
        this.elementWrapper.containerTemplate.replaceHTML(
            /focusout_event_added/gm,
            "onBlur"
        );
    }

    private traceTemplateWithChangeEventPlaceholders() {
        this.elementWrapper.containerTemplate.replaceHTML(
            /ngmodelchange_event_added/gm,
            "(ngmodelchange)"
        );

        this.elementWrapper.containerTemplate.replaceHTML(
            /change_event_added/gm,
            "onChange"
        );
    }

    private traceTemplateWithFileUploadEventPlaceholders() {
        this.elementWrapper.containerTemplate.replaceHTML(
            /file_upload_event_added/gm,
            "onChange"
        );
    }
}


export abstract class ElementTracerConfiguration {

    protected _strategy: {};

    get strategy(){
        return this._strategy;
    }
    abstract setStrategy(): void;
}

export class JSONElementTracerConfiguration extends ElementTracerConfiguration {

    private configurationFilePath: string;

    private readonly defaultJSONTracingConfiguration = {
        "click": true,
        "ngSubmit": true,
        "routerLink": true,
        "href": true,
        "focusOut": true,
        "change": true,
        "file": true
    };

    /**
     * Creates a JSON-file-based tracing configuration mode
     * to set the tracing strategy using the JSON configuration file
     * at `configurationFilePath`.
     *
     * @param configurationFilePath The path to the JSON configuration
     * file used to set the tracing strategy of the created JSON-file-based
     * tracing configuration mode.
     */
    constructor(configurationFilePath: string){
        super();
        this.configurationFilePath = configurationFilePath;
        this.setStrategy();
    }

    /**
     * Sets the tracing strategy object of this
     * JSON-file-based tracing configuration mode
     * by parsing its provided JSON configuration file.
     * If no path is provided for the JSON configuration file,
     * a default configuration is used to set the tracing strategy object.
     */
    setStrategy(){
        if(this.configurationFilePath){
            let configurationFile = fse.readFileSync(this.configurationFilePath,"utf-8");
            this._strategy = JSON.parse(configurationFile.trim());
        }
        else
            this._strategy = this.defaultJSONTracingConfiguration;
    }
}

export class ElementIDGenerator extends ElementVisitor {

    /**
     * This element ID generator's ID separator.
     */
    private readonly IDSeparator = "__";

    /**
     * An optional **element tracer** that can be used by
     * this element ID generator to determine whether
     * the encapsulated element wrapper requires identification or not.
     *
     * **Note**: If this attribute is defined, then the ID generation
     * mechanism for the encapsulated element wrapper is coupled
     * to its tracing mechanism.
     */
    private elementTracer: ElementTracer;

    /**
     * Creates an element ID generator that will generate an ID
     * for the element wrapper `elementWrapper`, possibly based
     * on the **element tracer** `elementTracer`.
     * @param elementWrapper The `ElementWrapper` that will be assigned an ID
     * by the created element ID generator.
     * @param elementTracer The optional `ElementTracer` that will be used by
     * the created ID generator to determine whether `elementWrapper` requires
     * identification or not.
     *
     * @see {@link ElementWrapper}
     * @see {@link ElementTracer}
     */
    constructor(elementWrapper: ElementWrapper, elementTracer?: ElementTracer){
        super(elementWrapper);
        if (elementTracer)
            this.elementTracer = elementTracer;
    }

    /**
     * Sets a pre-ID-generation condition on the encapsulated element wrapper to be identified,
     * namely by checking whether it requires identification or not.
     * @returns `true` if the encapsulated element wrapper requires identification, `false` otherwise.
     *
     * @see {@link ElementIDGenerator.requiresIdentification}
     */
    preVisit(): boolean {
        return this.requiresIdentification();
    }

    visit(): void {
        if (this.preVisit()){
            let widgetTag = this.elementWrapper.tag;
            this.elementWrapper.containerTemplate.addWidgetToDictionary(widgetTag);
            this.elementWrapper.id = this.generateID(widgetTag);
            console.log(`Element tag: ${widgetTag}, Element id: ${this.elementWrapper.id}`);
        }
    }


    postVisit(): any {

    }


    requiresIdentification(): boolean {
        let idGenerationCondition = !this.elementWrapper.id;

        if (this.elementTracer)
            idGenerationCondition = idGenerationCondition
                && this.elementTracer.requiresTracing();

        return idGenerationCondition;
    }

    private generateID(tagName: string): string {
        let id: string = "";
        switch(tagName){
            case "BUTTON":
                id = this.generateIDForButton();
                break;

            case "A":
                id = this.generateIDForAnchor();
                break;

            case "INPUT":
                id = this.generateIDForInput();
                break;

            case "FORM":
                id = this.generateIDForForm();
                break;

            case "SELECT":
                id = this.generateIDForSelect();
                break;

            case "TEXTAREA":
                id = this.generateIDForTextArea();
                break;

            case "IMG":
                id = this.generateIDForImage();
                break;

            case "EM":
                id = this.generateIDForEmphasis();
                break;

            default:
                id = this.generateDefaultID();
        }

        if (!id)
            id = this.generateSymbolicID();

        id = id.replace(/\s+/g, "_");

        return id;
    }


    private generateContextualID(contextualAttributes: string[]): string {
        let primaryContextualIDComponent = "";
        let uuid = uuidv4();
        for (let attribute of contextualAttributes) {
            if (this.elementWrapper.hasAttribute(attribute)){
                primaryContextualIDComponent = this.elementWrapper.getAttribute(attribute);
                break;
            }
        }

        if (!primaryContextualIDComponent)
            primaryContextualIDComponent = this.generateDefaultID();

        if (primaryContextualIDComponent)
            return `${this.elementWrapper.tag}${this.IDSeparator}${primaryContextualIDComponent}${this.IDSeparator}${uuid}`;
        else
            return this.generateSymbolicID();

    }


    private generateIDForButton(): string {
        return this.generateContextualID(["name", "value", "formcontrolname"]);
    }


    private generateIDForAnchor(): string {
        return this.generateContextualID(["routerlink", "[routerlink]", "href", "name", "formcontrolname", "value"]);
    }


    private generateIDForInput(): string {
        return this.generateContextualID(["name", "formcontrolname", "placeholder"]);
    }


    private generateIDForForm(): string {
        return this.generateContextualID(["name", "[formgroup]"]);
    }


    private generateIDForSelect(): string {
        return this.generateContextualID(["name", "formcontrolname"]);
    }

    private generateIDForTextArea(): string {
        return this.generateContextualID(["name", "formcontrolname"]);
    }


    private generateIDForImage(): string {
        return this.generateContextualID(["src", "alt", "name", "formcontrolname"]);
    }

    private generateIDForEmphasis(): string {
        if (!this.elementWrapper.isClickable())
            return "routerLink";
        return this.elementWrapper.getAttribute("onClick")
                                          .split("(")[0];
    }


    private generateSymbolicID(): string {
        let elementNumber = this.elementWrapper.containerTemplate.widgetDictionary[this.elementWrapper.tag];
        return `${this.elementWrapper.tag}${this.IDSeparator}${elementNumber}`;
    }


    private generateDefaultID(): string {
        return this.getTextOfFirstNonEmptyChild(this.elementWrapper.element);
    }


    private getTextOfFirstNonEmptyChild(element: Element): string {
        let text = "";
        for (let child of Array.from(element.childNodes)){
            text = child.textContent.replace(/[\n\r]+|[\s]{2,}/g, ' ').trim();

            if (text.length > 0)
                break;
        }

        if (text.length == 0 && element.parentElement)
            return this.getTextOfFirstNonEmptyChild(element.parentElement);

        return text;
    }
}