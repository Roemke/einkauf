/* uebergebe Liste von Elementen */
//class Dragabble {} hmm, neuer ansatz ES6, jedoch ist nicht klar wie gut die Browser das unterstützen
/*
   also  teilweise unterstützung für class / meine Anfänge
   firefox ubuntu geht,
   chrome mobile geht
   mi browser mobile geht
   firefox mobile geht nicht, doch, hatte anscheinend version aus dem cache gesehen
/*
    1) https://htmldom.dev/drag-and-drop-element-in-a-list/ - ohne draggable type, etwas aufwendiger
    2) https://web.dev/drag-and-drop/ - mit draggable, Autor schreibt: geht nicht unter mobile
    vielleicht ein Mix - hmm beide gehen nicht in firefox mobile

    1) nutzt draggable nicht, sondern erledigt dies mit mousedown and move, das könnte man per touch realisieren
    mousedown arbeitet nicht mit einem touchscreen

    Binde ich beide events an, dann wird der Handler jeweils einmal gerufen, entweder mit mousedown oder mit touchstart event.
    (hmm, was meinte ich, nochmal denken...)

    Nach Problemen mit den Touch-Events und einem Hinweis: Sind pointerevents sinnvoll, um das ganze umzusetzen?
    Probleme: Das device scrolled, preventDefault ist "verboten"
    Bedienung mit dem Browser funktioniert bei einfachem Ersetzen
    mousedown -> pointerdown
    mousemove -> pointermove
    mouseup   -> pointerup

    Bei pointerevents gibt es auch beim Touch ein movementY -> hätte mir arbeit sparen können ...
    aber das pointermove event wird nach kurzer Bewegung nicht mehr aufgerufen?
    The pointermove event is fired when a pointer changes coordinates, and the pointer has not been canceled by a browser touch-action.
    stelle mal um und hänge die events an document.body und setze style touchAction="none" dynamisch, aber das geht nicht ...
    alles Murcks

    setze touch-action in css auf none - es funktioniert, aber man kann nicht mehr scrollen - das ist ärgerlich
    prevent-default in pointermove hilft nicht 

    aber q&d: in touchmove hilft es ...

*/

class Dragabble
{
    //private properties
    //hmm, und wenn es die Klasse im CSS schon gibt?
    static #dragClass = 'dragClassKaRo';
    static #shiftSignClass = 'shiftSignKaRo';
    static #placeHolderClass = 'placeHolderKaRo';

    static #dragSelectedKaroClass = 'dragSelectedKaRo';
    static #draggingEle = null; //aktives element, nur eines denkbar
    static #placeHolder = null; //fuer das verschobene Element
    static #placeHolderInserted = false;

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
        border: 2px solid #aaa; \
    }\
    .placeHolderKaRo {\
        border: 2px dashed blue; \
        background-color: #eee; \
    }\
    ';
    #name ; //debug-Gruende, evtl. mehrere Objekte gleichzeitig (obwohl: wie dann das richtige heraus suchen)
    #elements; //oh, die muss man tatsaechlich angeben, sonst gibt es beim Zugriff einen Fehler

    static #previousTouch; //nur fuer ein touch element, fuer movementY noetig, das gibt's beim Touch nicht

    static #deltaX; //Abstand des Mouseclicks von der linken oberen Ecke
    static #deltaY;
    static #width;  //des Elements, bevor es auf position absolute gesetzt wird
    static #height;



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
            let clone = el.cloneNode(true); //tiefe kopie (true)
            let inputs = clone.querySelectorAll('input');
            for (let el of inputs)//ausschalten
                el.disabled = true; //readOnly geht nicht, aber so schon
            store.push(clone);
            clone.classList.add(Dragabble.#dragClass);
            clone.firstChild.style['flex'] = '0 0 90%';
            clone.firstChild.before(this.#generateShiftSign());
            clone.addEventListener('pointerdown',this.#mouseDownHandler);
            //clone.addEventListener('touchstart',this.#mouseDownHandler);
            //clone.addEventListener('mouseup',this.#mouseUpHandler);
            //clone.addEventListener('touchend',this.#mouseUpHandler);
            el.replaceWith(clone); //ersetze im DOM damit sind auch die listener weg
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
            el.removeEventListener('pointerdown',this.#mouseDownHandler);
            //el.removeEventListener('touchstart',this.#mouseDownHandler);
        }

        /*wollte den Handler mal static machen, geht aber nicht, irgendwo unten dokumentiert.
        Interessant, auch wenn man es ausführt kein Fehler, ich entferne ein undefined (Dragabble.glo...), das interessiert
        JS anscheinend nicht
        if (--Dragabble.#dragCounter <= 0 )
        {  //letzer entfernt
            document.removeEventListener("mouseup",Dragabble.globalMouseUpHandler);
            document.removeEventListener("touchend",Dragabble.globalMouseUpHandler); //mal sehen, dürfte nicht stören
        }
        */
    }


    //und ein wenig private
    //static method(s)
    //eventlistener auf dem document wird von den anderen listenern entfernt
    //vermute, dass der globale Handler reicht

    //ein q&d hack, verhindere beim touchmove das default verhalten um scrollen zu unterbinden. 
    #disableDefaultTouchMove = e => {
        e.preventDefault();
        e.stopPropagation();
    }

    //handler fuer diverse Elemente0
    #mouseDownHandler = e => { //hinweis gefunden: fat-arrow syntax binds to the lexical (?) scope of the function
                                //damit ist this nicht das objekt auf dem der event ausgeloest wurde, sondern mein Objekt
        //ermittle das zugehörige Element
        document.body.addEventListener("touchmove",this.#disableDefaultTouchMove,{passive:false})
        document.body.addEventListener("pointerup",this.#globalMouseUpHandler);//,{once : true})//nur einmal
        //vorsicht, ein einfaches true heißt nicht false, sondern das der event in der capturing phase und nicht  in der bubbling phase agefangen wird
        //document.addEventListener("touchend",this.#globalMouseUpHandler);//,{once : true})//nur einmal
        for (const el of this.#elements)
        {
            if (el.contains(e.target)) //habe in ein oder auf das Listenelement geclickt
            {
                Dragabble.#draggingEle = el; //mal auf static gesetzt, ein aktuelles kann es nur eines geben
                el.classList.add(Dragabble.#dragSelectedKaroClass);
                const rect = el.getBoundingClientRect(); //x und y sind left und top, bezieht sich auf viewport
                Dragabble.#width = rect.width;
                Dragabble.#height = rect.height;
                Dragabble.#placeHolder = el.cloneNode(false); //keine tiefe kopie
                let ph = Dragabble.#placeHolder;
                ph.style.width = Dragabble.#width + "px";
                ph.style.height = Dragabble.#height + "px";
                ph.classList.add(Dragabble.#placeHolderClass);
                //pruefe ob touchstart, oder mousedown - ersteres -> event steckt n changedTouches
                //let event =  (e.type == "touchstart") ? e.changedTouches[0] : e; 
                Dragabble.#deltaX = e.clientX - rect.x; //clientX Y  auch auf Viewport bezogen
                Dragabble.#deltaY = e.clientY - rect.y;
                document.body.addEventListener("pointermove",this.#mouseMoveHandler);
                console.log("attach mousemove object has name " + this.#name)
                break;
            }
1        }
    }

    //geht prinzipiell, aber wenn der user zu schnell bewegt, dann verliert man den Handle
    //lässt sich eventuell über client rect lösen und indem ich statt movement die absoluten positionen
    //verwende - mal sehen, ja, außerdem an das dokument binden
    #mouseMoveHandler = e => {
        e.preventDefault();
        e.stopPropagation();
        const el = Dragabble.#draggingEle;
        const ph = Dragabble.#placeHolder;
        if (el != null) //hatte hier manchmal null - warum?
        {
            //position absolte kann die Breite ändern, höhe eigentlich nicht, aber nehme es mal dazu
            el.style.width = Dragabble.#width+"px";
            el.style.height = Dragabble.#height+"px";
            if (!Dragabble.#placeHolderInserted)
            {//einfuegen
                el.after(Dragabble.#placeHolder); //erst drag ele, dann der platzhalter
                Dragabble.#placeHolderInserted = true;
            }
            el.style.position="absolute";
            el.style.top =   parseInt(e.pageY - Dragabble.#deltaY) +"px";
            el.style.left = parseInt(e.pageX - Dragabble.#deltaX) + "px"; //page, da sich absolute auf die page bezieht
            //console.log("style top: "+ el.style.top)
            if(e.movementY > 0 //nach unten
                && ph.nextElementSibling //ein nachfolger unter dem platzhalter ist da
                && this.#myListContains(ph.nextElementSibling) //Bedingung, dass der nächste auch zu meiner Liste gehört
                &&  Dragabble.#isAbove( ph.nextElementSibling, el))//el unter dem nächsten unterhalb des Plathalters
                {
                    Dragabble.#swap(ph, ph.nextElementSibling);
                    Dragabble.#swap(el, el.nextElementSibling); //siblings passen sich bei jedem swap an
                }
            let prev = el.previousElementSibling;//über dem zu verschiebenden
            if(e.movementY < 0 //nach oben
                &&  prev
                && this.#myListContains(prev) //Bedingung, dass der nächste auch zu meiner Liste gehört
                &&  Dragabble.#isAbove( el, prev))//el über dem vorigen oberhalb des Plathalters
                {
                    Dragabble.#swap(el, prev);
                    Dragabble.#swap(ph, prev)
                }
        }
    }
    //Handler geht nicht static? - muss den mouseMoveHandler entfernen und der geht nicht static
    #globalMouseUpHandler = e => { //muesste doch auch privat gehen
        console.log("in mouseuphandler object hast name " + this.#name)
        Dragabble.#previousTouch = null;
        if (Dragabble.#draggingEle != null)
            Dragabble.#draggingEle.classList.remove(Dragabble.#dragSelectedKaroClass);
        let ph = Dragabble.#placeHolder
        let el = Dragabble.#draggingEle;
        ph && ph.parentNode && ph.parentNode.removeChild(ph);
        Dragabble.#placeHolderInserted = false;
        el.style.removeProperty('top');
        el.style.removeProperty('left');
        el.style.removeProperty('position');
        document.body.removeEventListener("pointermove",this.#mouseMoveHandler);
        //document.removeEventListener("touchmove",this.#mouseMoveHandler);
        //dachte ich könnte den mouseMoveHandler privat machen, aber dieses this scheint manchmal die Falsche Klasse zu sein?
        //das habe ich nicht verstanden... ach verflixt, muss die Technik von unten verwenden
        Dragabble.#draggingEle = null;
        Dragabble.#placeHolder = null;
        document.body.removeEventListener("pointerup",this.#globalMouseUpHandler);
        document.body.removeEventListener("touchmove",this.#disableDefaultTouchMove,{passive:false});

    }

    //hilfsmethoden
    static #isAbove (nodeA, nodeB) {
        // Get the bounding rectangle of nodes
        const rectA = nodeA.getBoundingClientRect();
        const rectB = nodeB.getBoundingClientRect();

        return rectA.top + rectA.height / 2 < rectB.top + rectB.height / 2;
    };
    //austausch, klappt auch wenn im DOM eingehängt
    static #swap(nodeA, nodeB)
    {
        const parentA = nodeA.parentNode;
        const siblingA = nodeA.nextSibling === nodeB ? nodeA : nodeA.nextSibling;
               //A B dann A, wenn A C B D dann C
        // Move `nodeA` to before the `nodeB`
        nodeB.before(nodeA); //vor B wird A eingefügt

        // Move `nodeB` to before the sibling of `nodeA`
        siblingA.before(nodeB);
    }

    #myListContains(element)
    {
        for (const el of this.#elements)
            if (el == element)
                return true;
        return false;
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
        insert.classList.add(Dragabble.#shiftSignClass);
        insert.innerHTML = "&equiv;";
        return insert;
    }
}