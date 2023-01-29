/* uebergebe Liste von Elementen */
//class Dragabble {} hmm, neuer ansatz ES6, jedoch ist nicht klar wie gut die Browser das unterstützen
//uups firefox mobile gar nicht ...Anfänge laufen im Browser, mehr nicht
/*
   also  teilweise unterstützung für class / meine Anfänge
   firefox ubuntu geht,
   chrome mobile geht
   mi browser mobile geht 
   firefox mobile geht nicht  
/*
    https://htmldom.dev/drag-and-drop-element-in-a-list/ - ohchrone draggable type, etwas aufwendiger
    https://web.dev/drag-and-drop/ - mit draggable, Autor schreibt: geht nicht unter mobile
    vielleicht ein Mix
*/

class Dragabble
{
    //private properties
    //hmm, und wenn es die Klasse im CSS schon gibt?
    #dragClass = 'dragClassKaRo';
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
        position: relative; \
        bottom: 6px; \
        flex: 0 0 5%;  \
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
        insert.classList.add('shiftSignKaRo');
        insert.innerHTML = "&equiv;";
        return insert;
    }
}