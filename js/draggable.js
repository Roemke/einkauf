/* uebergebe Liste von Elementen */
//class Dragabble {} hmm, neuer ansatz ES6, jedoch ist nicht klar wie gut die Browser das unterstützen
class Dragabble
{
    //private properties
    //hmm, und wenn es die Klasse im CSS schon gibt?
    #dragClass = 'dragClassKaro';
    #dragClassText = '\
    .dragClassKaro { \
        cursor: move;\
        user-select: none; \
    } \
    {\
    .dragClassKaro::after {\
        text: bla; \
    }\
    ';
    #sheet;
    //public methods
    constructor (elements)
    {
        this.#elements = elements;
        this.#generateCssClass();
    }
    makeDragabble()
    {
        //erstmal nur kosmetik, haenge die Klassen an
        for (const el of this.#elements)
        {
            el.classList.add(this.#dragClass);
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
}