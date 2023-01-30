/* uebergebe Liste von Elementen */
//class Dragabble {} hmm, neuer ansatz ES6, jedoch ist nicht klar wie gut die Browser das unterstützen
//uups firefox mobile gar nicht ...Anfänge laufen im Browser, mehr nicht
/*
   also  teilweise unterstützung für class / meine Anfänge
   firefox ubuntu geht,
   chrome mobile geht
   mi browser mobile geht
   firefox mobile geht nicht, doch, hatte anscheinend version aus dem cache gesehen
/*
    1) https://htmldom.dev/drag-and-drop-element-in-a-list/ - ohchrone draggable type, etwas aufwendiger
    2) https://web.dev/drag-and-drop/ - mit draggable, Autor schreibt: geht nicht unter mobile
    vielleicht ein Mix - hmm beide gehen nicht in firefox mobile

    1) nutzt draggable nicht, sondern erledigt dies mit mousedown and move, das könnte man per touch realisieren
    mousedown arbeitet nicht mit einem touchscreen

    Binde ich beide events an, dann wird der Handler jeweils einmal gerufen, entweder mit mousedown oder mit touchstart event.

*/

class Dragabble
{
    //private properties
    //hmm, und wenn es die Klasse im CSS schon gibt?
    static #dragClass = 'dragClassKaRo';
    static #shiftSignKaRoClass = 'shiftSignKaRo';

    static #dragSelectedKaroClass = 'dragSelectedKaRo';
    static #draggingEle = null; //aktives element, nur eines denkbar
    static #dragCounter = 0;
    static #dragStyleGenerated = false;
    static #dragClassText = '\
    .dragClassKaRo { \
        cursor: move;\
        user-select: none; \
        display: flex; \
        justify-content: space-between; \
    } \
    .shiftSignKaRo {\
        font-size: 150%; \
        padding: 0px 2em; \
        flex: 0 0 5%;  \
    }\
    .dragSelectedKaRo {\
        opacity: 0.6; \
        border: 1px solid #aaa; \
    }\
    ';
    #name ; //debug-Gruende, evtl. mehrere Objekte gleichzeitig (obwohl: wie dann das richtige heraus suchen)
    #elements; //oh, die muss man tatsaechlich angeben, sonst gibt es beim Zugriff einen Fehler


    //static method(s)
    //eventlistener auf dem document nur einmal ausgeführt (once) und wird von den anderen listenern entfernt
    static globalMouseUpHandler(params) {
        if (Dragabble.#draggingEle != null)
            Dragabble.#draggingEle.classList.remove(Dragabble.#dragSelectedKaroClass);
        Dragabble.#draggingEle = null;
    }

    //public methods
    constructor (elements,name = "")
    {
        this.#elements = elements;
        this.#name = name;
        this.#generateCssClass();
        this.#generateShiftSign();
    }
    makeDragabble()
    {
        let store = [];
        for (let el of this.#elements)
        {
            let clone = el.cloneNode(true);
            let inputs = clone.querySelectorAll('input');
            for (let el of inputs)
                el.disabled = true; //readOnly geht nicht, aber so schon
            store.push(clone);
            clone.classList.add(Dragabble.#dragClass);
            clone.firstChild.style['flex'] = '0 0 90%';
            clone.firstChild.before(this.#generateShiftSign());
            clone.addEventListener('mousedown',this.#mouseDownHandler);
            clone.addEventListener('touchstart',this.#mouseDownHandler);
            clone.addEventListener('mouseup',this.#mouseUpHandler);
            clone.addEventListener('touchend',this.#mouseUpHandler);
            el.replaceWith(clone);
            //problem: alte eventlistener hängen ggf. noch an den Objekten, entferne sie - kenne keine Methode sie zu ermitteln             //und am Ende wieder anzufügen.
        }
        //once geht doch nicht, zieht man ein element zweimal irgendwo hin, klappt es beim zweiten mal nicht mehr
        if (Dragabble.#dragCounter == 0)
        {
            document.addEventListener("mouseup",Dragabble.globalMouseUpHandler);//,{once : true})//nur einmal
            //vorsicht, ein einfaches true heißt nicht false, sondern das der event in der capturing phase und nicht  in der bubbling phase agefangen wird
            document.addEventListener("touchend",Dragabble.globalMouseUpHandler);//,{once : true})//nur einmal
        }
        Dragabble.#dragCounter++;
        this.#elements = store; //ersetze  die Liste
        //for (let el of this.#elements)
        //    el.classList.remove("dragClassKaRo");
    }

    makeUnDraggable()
    {
        for (let el of this.#elements)
        {
            let inputs = el.querySelectorAll('input');
            for (let el of inputs)
                el.disabled = false;
            el.classList.remove(Dragabble.#dragClass);
            el.firstChild.remove();
            el.removeEventListener('mousedown',this.#mouseDownHandler);
            el.removeEventListener('touchstart',this.#mouseDownHandler);
            el.removeEventListener('mouseup',this.#mouseUpHandler);
            el.removeEventListener('touchend',this.#mouseUpHandler);
        }

        if (--Dragabble.#dragCounter <= 0 )
        {  //letzer entfernt
            document.removeEventListener("mouseup",Dragabble.globalMouseUpHandler);
            document.removeEventListener("touchend",Dragabble.globalMouseUpHandler); //mal sehen, dürfte nicht stören
        }
    }

    //und ein wenig private
    //handler fuer diverse Elemente
    #mouseDownHandler = e => { //hinweis gefunden: fat-arrow syntax binds to the lexical (?) scope of the function
                                //damit ist this nicht das objekt auf dem der event ausgeloest wurde, sondern mein Objekt
        //ermittle das zugehörige Element
        for (const el of this.#elements)
        {
            if (el.contains(e.target))
            {
                Dragabble.#draggingEle = el; //mal auf static gesetzt, ein aktuelles kann es nur eines geben
                el.style.position="relative";
                if (isNaN(parseInt(el.style.top)))
                    el.style.top=el.style.left="0px";
                //sehr amüsant, das geht, wenn man zu schnell ist, dann verliert man das Element :-)
                document.addEventListener("mousemove",this.#mouseMoveHandler);
                el.classList.add(Dragabble.#dragSelectedKaroClass);
                break;
            }
        }
    }

    //geht prinzipiell, aber wenn der user zu schnell bewegt, dann verliert man den Handle
    //lässt sich eventuell über client rect lösen und indem ich statt movement die absoluten positionen 
    //verwende - mal sehen 
    #mouseMoveHandler = e => {
        const el = Dragabble.#draggingEle;
        if (el != null) //hatte hier manchmal null - warum? 
        {
            let y = parseInt(el.style.top);
            let x = parseInt(el.style.left);
            console.log(" x=" + x + " dx=" + e.movementX + " y=" + y + " dy=" + e.movementY);
            el.style.top = y + e.movementY +"px";
            el.style.left = x + e.movementX + "px";
        }
    }
    #mouseUpHandler = e => {
        e.stopPropagation(); //sonst wird der handler am document aufgerufen (jedenfalls, wenn man debuggt)
        document.removeEventListener("mousemove",this.#mouseMoveHandler);
        //prüfe ob das ziel in meiner Liste ist
        let target = null;
        for (const el of this.#elements)
        {
            if (el.contains(e.target))
            {
                target = el;
                break;
            }
        }
        if (Dragabble.#draggingEle != null)
        {
            Dragabble.#draggingEle.classList.remove(Dragabble.#dragSelectedKaroClass);
            Dragabble.#draggingEle = null;
            //folgendes scheint nicht zu stören, wenn der listener nicht da ist
            /*
            document.removeEventListener("mouseup",Dragabble.globalMouseUpHandler);
            document.removeEventListener("touchend",Dragabble.globalMouseUpHandler);
            ist aber nicht klug, zieht man das Element nochmal, diesmal auf ein Element außerhalb der Liste,
            dann ist der Handler weg, lieber e.stopPropagation oben, das ist auf jeden Fall ok 
            */
        }
    }

    #generateCssClass()
    {
        //ohne document geht es nicht ?- hänge die Klasse ein
        if (! Dragabble.#dragStyleGenerated)
        {
            let sheet = document.createElement('style');
            sheet.innerHTML = Dragabble.#dragClassText;
            document.head.appendChild(sheet);
        }
    }
    #generateShiftSign()
    {
        let insert = document.createElement('div');
        insert.classList.add(Dragabble.#shiftSignKaRoClass);
        insert.innerHTML = "&equiv;";
        return insert;
    }
}