//Erst diverse Funktionen "main" unten - wenn window das load Event auslöst
/*
   2023-01-27: sort eingebaut, dabei aufgefallen save der konfiguration klappt nicht ganz, Meldung keine Aenderung
   und die tokengeschichte am Anfang klappt nicht 
*/
const programm = "php/ajaxHandler.php";

//Funktionen Liste

function addEntry(checked, text, end=true)
{
     /* Aufbau ist:
        <li>
          <div>
            <label> <input type="checkbox"> <span>First Entry</span></label> <span class="lifted">&#128465;</span>
          </div>
        </li>
        */
    let liste = document.getElementById("list");

    //gibt es ein element mit dem Text-Eintrag schon - dann entfernen, das neue wird sowieso gecheckt und nach oben gesetzt
    const itemList = document.querySelectorAll("li div input + span");
    let foundItem = false;
    let compareText = text.toLowerCase().trim();
    for(let i = 0; i < itemList.length; ++i)
    {
        let ittext = itemList[i].innerText.toLowerCase().trim();

        if (compareText == ittext)
        {
            foundItem = itemList[i];
            break;
        }
    }
    if (foundItem)
        liste.removeChild(foundItem.parentNode.parentNode.parentNode);//richtig zaehlen :-)
    //und das neue 
    let li = document.createElement("li");
    let div = document.createElement("div");
    let label = document.createElement("label");
    let input = document.createElement("input");
    input.type = "checkbox";
    if (checked == 1)
        input.checked = true;
    input.addEventListener("change", e => {
        let li = e.currentTarget.parentNode.parentNode.parentNode;
        if (e.currentTarget.checked)
        {
            moveDown(li);
        }
        else
            moveUp(li); //ganz nach oben
        emphSave();
        if(localStorage.getItem("saveDirect")==="true")
        {
            writeEntriesToServer();
            emphSaveRemove();
        }
    //console.log(li);
    });

    let span1 = document.createElement("span");
    let span2 = document.createElement("span");
    //und zusammen bauen
    span1.appendChild(document.createTextNode(text));
    span2.innerHTML = "&#128465;";
    span2.classList.add("lifted");
    span2.addEventListener("click", event => {
        let liste = document.getElementById("list"); //falls sich liste geändert hat
        let li = event.currentTarget.parentNode.parentNode;
        liste.removeChild(li);
        emphSave();
        if(localStorage.getItem("saveDirect")==="true") //texte in localstorage
        {
            writeEntriesToServer();
            emphSaveRemove();
        }

    });
    label.appendChild(input);
    label.appendChild(span1);
    div.appendChild(label);
    div.appendChild(span2);
    li.appendChild(div);

    if(!end && liste.firstChild)
        liste.firstChild.before(li);
    else
        liste.appendChild(li);
}
function fillList(data)
{
    //leeren
    let liste = document.getElementById("list");
    liste.innerHTML = "";
    for (const entry of data)
    {
       addEntry(entry[0],entry[1]);
    }
}

function moveDown(li)
{ //move down as far as I found another checked item
    let liste = document.getElementById("list");
    let target = null;
    let childs = liste.childNodes;
    //console.log(childs[0]);
    for (const element of childs) //problem: finde das element selbst
    {
        if (element.firstChild.firstChild.firstChild.checked
            && element.firstChild.firstChild.firstChild != li.firstChild.firstChild.firstChild )
        {
            target = element;
            break;
        }
    }
    if (target)
    {
        target.before(li);
    }
    else
    {
        liste.lastChild.after(li);
    }
}

function moveUp(li)
{ //move up
    let liste = document.getElementById("list");
    let childs = liste.childNodes;
    if (liste.firstChild)
    {
        liste.firstChild.before(li);
    }
}

//styles anpassen, warning / error
function error(text,overwrite=true,timeout=null)
{
    if (typeof error.timeOutId != "undefined")
        clearTimeout(error.timeOutId);

    if (overwrite)
        document.getElementById("errorText").innerHTML = text;
    else
        document.getElementById("errorText").innerHTML += text;
    document.getElementById("error").classList.remove("hidden");
    if (timeout)
        error.timeOutId = setTimeout(() => {document.getElementById("error").classList.add("hidden");},timeout);
}

function info(text,overwrite=true,timeout=null)
{
    if (typeof info.timeOutId != "undefined")
        clearTimeout(info.timeOutId);
    if (overwrite)
        document.getElementById("infoText").innerHTML = text;
    else
        document.getElementById("infoText").innerHTML += text;
    document.getElementById("info").classList.remove("hidden");
    if (timeout)
        info.timeOutId = setTimeout(() => {document.getElementById("info").classList.add("hidden");},timeout);
}

//save hervorheben
function emphSave()
{
    let b = document.getElementById("bSave");
    b.classList.add("changed");
}
function emphSaveRemove()
{
    let b = document.getElementById("bSave");
    b.classList.remove("changed");
}

//network functions
//diverse Fehler ananlysieren
function evaluateNetworkError(response, action)
{
    if ('name' in response && response.name=='TypeError') //netzwerk
    {
        error(action + " - Netzwerk? " + response.message  + " - später probieren",true,3000);
    }
    else if ('name' in response && response.name=='AbortError') //netzwerk timeout
    {
        info(action + " - Netzwerk Timeout - später probieren",true,3000);
    }
    else if ('state' in response && 'infoText' in response) //mein Objekt zurueck, also muss das einen Fehler haben
    {
        if (response.state == 2)
            info(action + " - " + response.infoText,true,3000);
        else
            error(action + " - " + response.infoText,true,3000);
    }
    else if (!response.ok) //fehler vom Server gemeldet 
    {
        error (action + " - Status: " + response.status + "("+response.statusText+")  Fehler des Servers, unklar, später probieren oder Entwickler kontaktieren");
    }
}

//holen, jedoch timeout reduzieren 
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 6000 } = options; //timeout aus den options heraus nehmen s. https://dmitripavlutin.com/javascript-object-destructuring/
                                        //in options steht timeout jetzt noch drin
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(resource, {
      ...options, //alle eigenschaften von options, auch timeout, aber der stoert nicht
      signal: controller.signal  
    });
    clearTimeout(id);
    return response;
  }

async function registerToken(token,datei)
{
    let postData = {action: 'registerToken', datei: datei, data: "",token: token};

    const response = await fetchWithTimeout(programm , //programm + "x" //+x fehler einbauen 
    {
      method: 'POST',
      timeout: 6000,
      headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
      body: JSON.stringify(postData)
    }).then( response => {//kein Netzwerkfehler
      if (response.ok) //daten gelesn
          return response.json(); //wieder promise
      return Promise.reject(response); //Fehler im PHP -Programm denkbar, catch wird erledigt
    }).then( jsonProm =>  { // bekomme  daten zurueck
      if (jsonProm.state != 0)//jasonProm ist mein Objekt
          return Promise.reject(jsonProm);
      localStorage.setItem("token",token);
      document.getElementById("iToken").value = token;
      return true;
    }).catch(response => { //netzwerk fehler / timeout oder Fehler wg not ok (Status != 200 ?
      evaluateNetworkError(response,"registerToken");
      return false;
    }); 
    return response; //async gibt promise zurueck, aber ich denke mit true / false geht es 
    /* erste überlegung, lasse ich "fuer mich" mal drin 
      return fetch(programm,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
        body: JSON.stringify(postData) //fetch liefert promise zurueck
    }).then(response => response.json())//short form of (response) => {return response.json()}
    */
    /*test - 
    unten ist result definiert, aber das return geht zum nächsten then (da result ein promise ist) aber ich gebe das 
    Objekt nicht zurück, daher oben return vor fetch
    .then( response =>
        {
            console.log(response);
            let result = response.json();
            return result
        }) 
    */
}
//async functions - Netzwerk
async function getEntriesFromServer()
{
    //let server = localStorage.getItem("server");
    let token = localStorage.getItem("token");
    let datei = localStorage.getItem("datei")//+ "x"; //+x ->fehler einbauen
    let postData = {action: 'loadData', datei: datei, data: "",token: token};

    const response = await fetchWithTimeout(programm //+ "x" //+x fehler einbauen 
      ,{
        method: 'POST',
        timeout: 6000,
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
          },
        body: JSON.stringify(postData)
    }).then( response => {//kein Netzwerkfehler
        if (response.ok) //daten gelesn
            return response.json(); //wieder promise
        return Promise.reject(response); //Fehler im PHP -Programm denkbar, catch wird erledigt
    }).then( jsonProm =>  { // bekomme  daten zurueck
        if (jsonProm.state != 0)//jasonProm ist mein Objekt
        {
            return Promise.reject(jsonProm);
        }
        fillList(jsonProm.entries);//alles klar
        console.log(jsonProm);
    }).catch(response => { //netzwerk fehler / timeout oder Fehler wg not ok (Status != 200 ?
        evaluateNetworkError(response,"load");
    });
}
async function writeEntriesToServer()
{
    //let server = localStorage.getItem("server");
    let token = localStorage.getItem("token");
    let datei = localStorage.getItem("datei");
    let fSettings = document.getElementById("fSettings");

    const entries =[];

    const checkList = document.querySelectorAll("li div input");
    const itemList = document.querySelectorAll("li div input + span");
    for (let i = 0; i < checkList.length;i++)
    {
        const check = checkList[i].checked;
        const item = itemList[i].innerText;
        let entry = {checked: check , item: item};
        entries.push(entry);
    }

    let postData = {action: 'saveData', datei: datei, data: entries, token: token};
    const response = await fetchWithTimeout(programm, //+ "x" //+x fehler einbauen
    {
      method: 'POST',
      timeout: 6000,
      headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
      body: JSON.stringify(postData)
    }).then( response => {//kein Netzwerkfehler
      if (response.ok) //daten gelesn
          return response.json(); //wieder promise
      return Promise.reject(response); //Fehler im PHP -Programm denkbar, catch wird erledigt
    }).then( jsonProm =>  { // bekomme  daten zurueck
      if (jsonProm.state == 1)//jsonProm ist mein Objekt
      {  //hier fehler
          return Promise.reject(jsonProm); //geht in catch
      }
      else if (jsonProm.state == 2) //neu laden, daten auf server geaendert
      {
        evaluateNetworkError(jsonProm, "Save");
        fillList(jsonProm.entries);//neu füllen
      }
      console.log(jsonProm);// sonst alles klar, nichts zu tun 
    }).catch(response => { //netzwerk fehler / timeout oder Fehler wg not ok (Status != 200 ?
      evaluateNetworkError(response, "Save");
    });
}

//hilfsfunktion(en)
function generateToken(n) {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var token = '';
    for(var i = 0; i < n; i++) {
        token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
}

function registerListenerEtc()
{
    let datei = localStorage.getItem("datei");
    let token = localStorage.getItem("token");
    document.getElementById("iDatei").value = datei;
    document.getElementById("iToken").value = token;
    addSettingsListener();
    addStandardListener();
    getEntriesFromServer();
}
//eventlistener hinzufuegen, settings und die "normalen"
function addSettingsListener()
{
    //fuer die Settings
    let bSettings = document.getElementById("bSettings");
    let bsSave = document.getElementById("bsSave");
    let bsCancel = document.getElementById("bsCancel");
    let bsClear = document.getElementById("bsClear");
    let fSettings = document.getElementById("fSettings");
    let main = document.getElementsByTagName("main")[0];
    let datei = localStorage.getItem("datei");
    let saveDirect = localStorage.getItem("saveDirect");

    bSettings.addEventListener("click", (e) => {
        e.preventDefault();
        fSettings.classList.remove("hidden");
        main.classList.add("hidden");
    });
    bsClear.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.clear();
        datei = "";
        document.getElementById("iDatei").value="";
        token = generateToken(32); //neues generieren, erst speichern, wenn registriert 
        document.getElementById("iToken").value=token;
    });
    //save muss ggf. auf registrierung des tokens warten 
    bsSave.addEventListener("click", async (e) => {
        e.preventDefault();
        //server = document.getElementById("iServer").value;
        datei = document.getElementById("iDatei").value.trim();
        oldDatei = localStorage.getItem("datei");
        saveDirect = document.getElementById("iSaveDirect").checked;
        localStorage.setItem("saveDirect",saveDirect);
        let token = document.getElementById("iToken").value;
        if (saveDirect)
            bSave.classList.add("hidden");
        else
            bSave.classList.remove("hidden");
        if (datei == "")
        {
            error("Datei benötigt",true,5000);
        }
        else if (oldDatei == datei)
        {
            info("Keine Änderung vorgenommen",true,3000);
            main.classList.remove("hidden");
            fSettings.classList.add("hidden");
        }
        else
        {
            let success = await registerToken(token,datei); //await - er wartet, dazu muss der listener async sein 
            if (success)
            {
               localStorage.setItem("token",token);
               localStorage.setItem("datei",datei);
               info("token registriert, lade Daten (Liste kann auch leer sein)",false,3000);
               main.classList.remove("hidden");
               fSettings.classList.add("hidden");
               addStandardListener();
               getEntriesFromServer();
            }
            else
            {
                fSettings.classList.remove("hidden");
                main.classList.add("hidden");
                error("<br>Ohne registriertes Token funktioniert die Seite nicht",false);
            }
        }
    });
    bsCancel.addEventListener("click",(e) => {
        e.preventDefault();
        //server = localStorage.getItem("server");
        datei = localStorage.getItem("datei");
        main.classList.remove("hidden");
        fSettings.classList.add("hidden");
    });

    //infofelder
    document.getElementById("berrorOk").addEventListener("click", (e) => {
        document.getElementById("error").classList.add("hidden");
    });
    document.getElementById("binfoOk").addEventListener("click", (e) => {
        document.getElementById("info").classList.add("hidden");
    });

}



//Standard Eventlistener fuer buttons etc 
function addStandardListener()
{
    let bSave = document.getElementById("bSave");
    let bAdd = document.getElementById("bAdd");
    let bReload = document.getElementById("bReload");
    let bSort = document.getElementById("bSort");
    let iAddTopic = document.getElementById("iAddTopic");

    //unnoetige event-Listener
    //folgendes wird im realen Einsatz nicht noetig sein, da ich den eventlistener beim dynamischen einfuegen der Elemente anhaenge
    let listEntries = document.querySelectorAll("span.lifted");
    let liste = document.getElementById("list");
    listEntries.forEach(element => {
        element.addEventListener("click", event => {
            let li = event.currentTarget.parentNode.parentNode;
            liste.removeChild(li);
            emphSave();
            if(localStorage.getItem("saveDirect")==="true")
            {
                writeEntriesToServer();
                emphSaveRemove();
            }
        });
    });

    //das genauso ?
    listEntries = document.querySelectorAll("li input");
    listEntries.forEach(element => {
        element.addEventListener("change", e => {
            let li = e.currentTarget.parentNode.parentNode.parentNode;
            if (e.currentTarget.checked)
            {   //nach untenverschieben über das erste checked element
                moveDown(li);
            }
            else
                moveUp(li); //ganz nach oben
            //console.log(li);
            emphSave();
            if(localStorage.getItem("saveDirect")==="true")
            {
                writeEntriesToServer();
                emphSaveRemove();
            }
        });
    });
    //--------------------------------------------
    //fuer die Einträge und Liste
    iAddTopic.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
          event.preventDefault();
          bAdd.click();
        }
    });

    bSave.addEventListener("click", (e)=> {
        e.preventDefault();
        writeEntriesToServer();
        emphSaveRemove();

    });
    bReload.addEventListener("click", (e)=> {
        e.preventDefault();
        getEntriesFromServer();
        emphSaveRemove();
    });

    bAdd.addEventListener("click", e => {
        e.preventDefault();
        let iAdd = document.getElementById("iAddTopic");
        addEntry(0,iAdd.value,false); //nicht am Ende sondern Anfang
        iAdd.value="";
        emphSave();
        if(localStorage.getItem("saveDirect")==="true")
        {
            writeEntriesToServer();
            emphSaveRemove();
        }
    });
    bSort.addEventListener("click",e => {
    	  e.preventDefault();
    	  //liste abrufen 
    	  const entries = document.querySelectorAll("#list li label");
    	  //erstelle zwei listen, eine mit den nicht markierten und eine mit den markierten also erledigten
    	  const todoEntries = [];
    	  const doneEntries = [];
    	  entries.forEach(el => {
    	  	if (el.childNodes[0].checked == false)
    	  	{ 
    	  		//console.log("find " + el.childNodes[1].innerText + " unchecked");
    	  		todoEntries.push(new Array(0,el.childNodes[1].innerText));
    	  	}
    	  	else
    	  	{
    	  		doneEntries.push(new Array(1,el.childNodes[1].innerText));
    	  	}    	  	
    	  });
    	  //sortieren 
    	  todoEntries.sort( (a,b) => {
    	    a = a[1].toLowerCase();
    	    b = b[1].toLowerCase();
    	  	return a.localeCompare(b);
    	  });
    	  doneEntries.sort( (a,b) => {
    	    a = a[1].toLowerCase();
    	    b = b[1].toLowerCase();
    	  	return a.localeCompare(b);
    	  });     	  
    	  fillList(todoEntries.concat(doneEntries));
    	  emphSave();
        if(localStorage.getItem("saveDirect")==="true") //texte in localstorage
        {
            writeEntriesToServer();
            emphSaveRemove();
        }

    });
}

//window - alles geladen 
window.addEventListener("load",async () =>
{
    let bSave = document.getElementById("bSave");
    let datei = localStorage.getItem("datei");
    let saveDirect = localStorage.getItem("saveDirect");
    let token = localStorage.getItem("token");

    let fSettings = document.getElementById("fSettings");
    let main = document.getElementsByTagName("main")[0];

    //kein token, generieren, register, speichern
    if (!token)
    {
        token = generateToken(32);
        document.getElementById("iToken").value=token;
    }
    if (!saveDirect)
    {
        saveDirect = "true"; //localstorage speichert strings
        localStorage.setItem("saveDirect",saveDirect);
    }
    document.getElementById("iSaveDirect").checked = (saveDirect === "true"); //sicherheitshalber setzen
    if (saveDirect==="true")
        bSave.classList.add("hidden");

    if (datei == null) //zwingend noetig, ein token gehoert zur Datei, bevor token registriert wird, muss die Datei da sein
    {
        fSettings.classList.remove("hidden");
        main.classList.add("hidden");
        addSettingsListener();//im save-Bereich wird das token registriert
    }
    else if (token == null || token == "") //sollte nicht passieren, im Entwicklungsprozess moeglich
    {
        info("ungewöhnlich, dies sollte nicht passieren, versuche token zu registrieren",true,3000);
        token = generateToken(32);
        let success = await registerToken(token,datei); //await - er wartet, dazu muss der listener async sein 
        if (success)
        {
           console.log("token registered");
           localStorage.setItem("token",token);
           registerListenerEtc();
        }
        else
        {
            console.log("unregistered");
            addSettingsListener();
            fSettings.classList.remove("hidden");
            main.classList.add("hidden");
            error("<br>Ohne registriertes Token funktioniert die Seite nicht",false);
        }
    }
    else //alles da
    {
        registerListenerEtc();
    }
});
