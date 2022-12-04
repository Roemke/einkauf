<?php
/*
   Quick & Dirty Ajax-Answer js-Client uses async await and fetch
   In the moment the program responses to each client, maybe we can limit this by using the 
   token generated on the first connect
*/
	setlocale(LC_ALL, "de_DE"); //only necessary if the locale isn't already set, 


	class TListEntry //wird nicht gebraucht 
  	{
    	public $done;
    	public $text;

    	function __construct($d,$t)
    	{
      		$this->done = $d;
      		$this->text = $t;
    	}
  	};
    //und eine Liste
	class TResult implements JsonSerializable
	{
	  	public $entries = array();
		public $infoText = "";
		public $state = 0;
		public $fileName;
		public $token;
		private $tokenFile;
		private $tokenList = array();
		public $registerAllowed = true;//auf false, wenn keine "clienten" genommen werden (nach einrichtung)

	  	function __construct($fileName,$token)
      	{
			$this->fileName = dirname(__FILE__,2) .'/'. $fileName;
			//error_log("Filename ist " . $this->fileName);
			$this->token = $token;
			$this->tokenFile = $this->fileName . "Tokens.list"; 
			$this->loadTokenList();
			//$this->log(var_export($this->tokenList,true));
		}
		public function log($s)
		{
			$fileName = dirname($this->fileName) . "/messages.log";
			file_put_contents($fileName,$s,FILE_APPEND);
		}
		public function loadTokenList()
		{
			if (file_exists($this->tokenFile) )
			{
				$data = file_get_contents($this->tokenFile);
				$jsonArr =  json_decode($data,true);
				if (is_array($jsonArr))
					$this->tokenList = $jsonArr;
				//sonst bleibt es ein leeres array
			}
		}
		public function saveTokenList()
		{
			file_put_contents($this->tokenFile,json_encode($this->tokenList));
		}

		public function jsonSerialize()
  		{
    		//return get_object_vars($this);
			return [
				'entries' => $this->entries,
				'infoText' => $this->infoText,
				'state' => $this->state,
				'token' => $this->token
			]; //nur ein subset zurueck geben 
		}
		public function saveData($entries)
		{  //as csv to fileName
			//error_log(var_export($entries,true));//uups, keine Fehlerbehandlung
			try
			{
				if(! array_key_exists($this->token,$this->tokenList))
					throw new Exception("Token nicht vorhanden");
				//pruefe, ob eine Speicherung nach dem letzten load statt gefunden hat
				$load =  $this->tokenList[$this->token]['load'];
				$modified = false;
				foreach ($this->tokenList as $t)
				{
					$this->log(var_export($t['save'],true));
					if ($t['save'] > $load) //scheint mit > zu funktionieren
					{
						$modified = true;
						break;
					}
				}
				if (!$modified)
				{
					$fp = fopen($this->fileName, 'w');
					foreach( $entries as $entry)
					{
						if ($entry['checked'])
							$entry['checked'] = 1;
						else
							$entry['checked'] = 0;
						fputcsv($fp,$entry);
					}
					$this->infoText = "ok";
					$this->state = 0;
					$now = new DateTime("now");
					//$load = $this->tokenList[$this->token]['load'];//wert sichern
					//wenn save gerufen und erfolgreich, dann ist der Zustand aktuell, setze also load auch auf now
					$this->tokenList[$this->token] = ['access' => $now,'save' => $now, 'load' => $now];
					$this->saveTokenList();
				}
				else
				{
					$this->loadData();
					$this->infoText = "Daten neu geladen, Änderung erneut vornehmen";
					$this->state = 2;
				}
			}
			catch (Exception $e)
			{
				$this->infoText = $e->getMessage();
				$this->state = 1;
			}
		}
		public function loadData()
		{//seltsam, das geht nicht mit try catch, php bricht ab mit uncaught type error, fatal error wenn datei nicht da
			//so ein quark
			try
			{
				if(! array_key_exists($this->token,$this->tokenList))
					throw new Exception("Token nicht vorhanden");
				if (!file_exists($this->fileName))
					throw new Exception("Datei nicht vorhanden");
				$fp = fopen($this->fileName,'r');
				if (!$fp)
					throw new Exception("Datei nicht lesbar");

				while ( ($data = fgetcsv($fp)) !== FALSE )
				{
					array_push($this->entries , $data);
				}
				$now = new DateTime("now");
				$save = $this->tokenList[$this->token]['save'];//wert sichern
				$this->tokenList[$this->token] = ['access' => $now,'save' => $save, 'load' => $now];
				$this->saveTokenList();

			}
			catch (Exception $e)
			{
				$this->infoText = $e->getMessage();
				$this->state = 1;
				//error_log("Exception handled");
			}
		}
		public function registerToken()
		{
			//error_log(var_export($this,true));
			if (! $this->registerAllowed)
			{
				$this->state = 1;
				$this->infoText = "Register nicht erlaubt, admin fragen:-)";
			}
			else
			{
				$this->state = 0;
				if (in_array($this->token,$this->tokenList))
				{
					$this->infoText = "Token schon vorhanden, registriert";
				}
				else
				{
					$this->infoText = "Token neu registriert";
				}
				//speichern der Information
				$this->tokenList[$this->token] = ['access' => new DateTime("now"),'save' => null, 'load' => null];
				$this->saveTokenList();

			}
		}
	};

    function evaluateRequest($action="",$fileName, $entries,$token)
    {
		$result = new TResult($fileName,$token);
		if ($action == "")
		{
			$result->infoText = "no action requested, need action=...";
			$result->state = 1;
		}
		else
		{
			try
			{
				//error_log("action is $action with token $token");
				switch ($action)
				{
						case "loadData":
							$result->loadData(); //wird gefuellt
							//error_log(var_export($result,TRUE));
						break;
						case "registerToken":
							$result->registerToken();
							break;
						case "saveData":
							$result->saveData($entries); //object is passed as ref
						break;
						default:
							$result->infoText = "unknown command/action " . $action . ", I only know loadData and saveData"; 
							$result->state = 1;
						break;
				}//eo switch
			}//eo try
			catch(Exception $e)
			{
				$result->state = 1;
				$result->infoText = $e->getMessage();
			}
		}
        return json_encode($result); 
    }

	//get the parameter
	//echo $_SERVER['DOCUMENT_ROOT'];
	//var_dump($_POST);
	$data = json_decode(file_get_contents('php://input'),true); //ah, so werden die raw post data im Body gelesen
	//error_log(var_export($data,true));
    //exit();
	$action = isset($data['action']) ? $data['action'] : "";
	$file = isset($data['datei']) ? $data['datei'] : "";
	$token = isset($data['token']) ? $data['token'] : "";
    $entries = isset($data['data']) ? $data['data'] : "";
    $result = evaluateRequest($action,$file,$entries,$token);
	//sleep(2); //timeout simulieren 
    echo $result;
 ?>

