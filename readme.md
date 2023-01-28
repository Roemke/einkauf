# Einkauf
Ein "Bastelprojekt", um sich mal wieder mit JavaScript und Ajax zu befassen. Es ist eine Einkaufsliste geworden, die sich für mehrere Personen - jedoch nicht beliebig viele (s.u.) verwenden lässt. Da sie so halbwegs :-) funktioniert, liegt sie nun auf github.

Nach ein wenig Überlegen würde ich jetzt vielleicht Websockets einsetzen, aber es ist auch so brauchbar.

## Installation
Sie benötigen einen WebServer, alle Dateien sind zu transferieren, z.B. in den Order einkauf. Danach ist http://serverName/einkauf der entsprechende Aufruf.

Das zugehörige php-Script speichert im Verzeichnis data/ darauf müssen also Schreibrechte für den Webserver eingerichtet sein (ich habe das ganze mit Apache getestet).

## Funktionsweise
Der Server arbeitet mit tokens, diese müssen natürlich registriert werden, das geschieht beim ersten Aufruf im Hintergrund. Das JavascriptProgramm erzeugt ein Token und registriert es beim Server. Dieses ist an eine Datei mit der Einkaufsliste gebunden. Hat man alle Interessenten registriert, dann lässt sich in der PHP-Klasse der Wert registerAllowed auf false setzen, dann werden keine weiteren Registrierungen erlaubt.

Zu jedem Zugriff wird neben dem Token auch der Zeitpunkt des letzten Speicherns / Ladens der Liste gesichert. So kann bei einem Versuch die Liste zu speichern geprüft werden, ob eine Speicherung von einem anderen Token aus vorgenommen wurde. Ist dies der Fall wird die Liste neu geladen und der Client wird informiert, das nicht gespeichert wurde.

Für meine Hobby-Liste reicht das aus.

## Erweiterungen
2023-01-27: Baue eine Sortiermöglichkeit ein, die Liste wird doch länger und man findet die Dinge, die schon da sind, eher schlecht wieder.
