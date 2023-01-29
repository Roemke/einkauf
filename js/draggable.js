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
    #dragClass = 'dragClassKaRo';
    #shiftSignKaRoClass = 'shiftSignKaRo';
    #dragSelectedKaRoClass = 'dragSelectedKaRo';

    #draggingEle;
    #dragClassText = '\
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

    #sheet;
    #elements; //oh, die muss man tatsaechlich angeben, sonst gibt es beim Zugriff einen Fehler

    //public methods
    constructor (elements)
    {
        this.#elements = elements;
        this.#generateCssClass();
        this.#generateShiftSign();
    }
    makeDragabble()
    {
        //erstmal nur kosmetik, haenge die Klassen an, entferne eventlistener
        let store = [];
        for (let el of this.#elements)
        {
            let clone = el.cloneNode(true);
            let inputs = clone.querySelectorAll('input');
            for (let el of inputs)
                el.disabled = true; //readOnly geht nicht, aber so schon
            store.push(clone);
            clone.classList.add(this.#dragClass);
            clone.firstChild.style['flex'] = '0 0 90%';
            clone.firstChild.before(this.#generateShiftSign());
            clone.addEventListener('mousedown',this.#mouseDownHandler);
            clone.addEventListener('touchstart',this.#mouseDownHandler);
            el.replaceWith(clone);
            //problem: alte eventlistener hängen ggf. noch an den Objekten, entferne sie - kenne keine Methode sie zu ermitteln             //und am Ende wieder anzufügen.
        }
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
            el.classList.remove(this.#dragClass);
            el.firstChild.remove();
        }
    }

    //und ein wenig private
    //handler fuer touchstart und mousedown
    #mouseDownHandler = e => { //hinweis gefunden: fat-arrow syntax binds to the lexical (?) scope of the function
                                //damit ist this nicht das obekt auf dem der event ausgeloest wurde, sondern mein Objekt
        //ermittle das zugehörige Element
        for (const el of this.#elements)
        {
            if (el.contains(e.target))
            {
                this.#draggingEle = el;
                el.classList.add(this.#dragSelectedKaRoClass);
                break;
            }
        }
        // Calculate the mouse position
        const rect = this.#draggingEle.getBoundingClientRect();
        console.log("downhandler rect  " + rect);
        // Attach the listeners to `document`
        //document.addEventListener('mousemove', mouseMoveHandler);
        //document.addEventListener('mouseup', mouseUpHandler);
    };

    #generateCssClass()
    {
        //ohne document geht es nicht ?- hänge die Klasse ein
        this.#sheet = document.createElement('style');
        this.#sheet.innerHTML = this.#dragClassText;
        document.head.appendChild(this.#sheet);
    }
    #generateShiftSign()
    {
        let insert = document.createElement('div');
        insert.classList.add(this.#shiftSignKaRoClass);
        insert.innerHTML = "&equiv;";
        return insert;
    }
}