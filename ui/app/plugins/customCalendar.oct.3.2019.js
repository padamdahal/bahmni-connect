/* jQuery IndexedDB plugin */
(function($,undefined){'use strict';var indexedDB=window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB;var IDBKeyRange=window.IDBKeyRange||window.webkitIDBKeyRange;var IDBCursor=window.IDBCursor||window.webkitIDBCursor||{};if(typeof IDBCursor.PREV==="undefined"){IDBCursor.PREV="prev";}
if(typeof IDBCursor.NEXT==="undefined"){IDBCursor.NEXT="next";}
var IDBTransaction=window.IDBTransaction||window.webkitIDBTransaction;function getDefaultTransaction(mode){var result=null;switch(mode){case 0:case 1:case "readwrite":case "readonly":result=mode;break;default:result=IDBTransaction.READ_WRITE||"readwrite";}
return result;}
$.extend({"indexedDB":function(dbName,config){if(config){if(typeof config==="number")config={"version":config};var version=config.version;if(config.schema&&!version){var max=-1;for(var key in config.schema){max=max>key?max:key;}
version=config.version||max;}}
var wrap={"request":function(req,args){return $.Deferred(function(dfd){try{var idbRequest=typeof req==="function"?req(args):req;idbRequest.onsuccess=function(e){dfd.resolveWith(idbRequest,[idbRequest.result,e]);};idbRequest.onerror=function(e){dfd.rejectWith(idbRequest,[idbRequest.error,e]);};if(typeof idbRequest.onblocked!=="undefined"&&idbRequest.onblocked===null){idbRequest.onblocked=function(e){var res;try{res=idbRequest.result;}catch(e){res=null;}
dfd.notifyWith(idbRequest,[res,e]);};}
if(typeof idbRequest.onupgradeneeded!=="undefined"&&idbRequest.onupgradeneeded===null){idbRequest.onupgradeneeded=function(e){dfd.notifyWith(idbRequest,[idbRequest.result,e]);};}}catch(e){e.name="exception";dfd.rejectWith(idbRequest,["exception",e]);}});},"transaction":function(idbTransaction){return{"objectStore":function(storeName){try{return wrap.objectStore(idbTransaction.objectStore(storeName));}catch(e){idbTransaction.readyState!==idbTransaction.DONE&&idbTransaction.abort();return wrap.objectStore(null);}},"createObjectStore":function(storeName,storeParams){try{return wrap.objectStore(idbTransaction.db.createObjectStore(storeName,storeParams));}catch(e){idbTransaction.readyState!==idbTransaction.DONE&&idbTransaction.abort();}},"deleteObjectStore":function(storeName){try{idbTransaction.db.deleteObjectStore(storeName);}catch(e){idbTransaction.readyState!==idbTransaction.DONE&&idbTransaction.abort();}},"abort":function(){idbTransaction.abort();}};},"objectStore":function(idbObjectStore){var result={};var crudOps=["add","put","get","delete","clear","count"];for(var i=0;i<crudOps.length;i++){result[crudOps[i]]=(function(op){return function(){return wrap.request(function(args){return idbObjectStore[op].apply(idbObjectStore,args);},arguments);};})(crudOps[i]);}
result.each=function(callback,range,direction){return wrap.cursor(function(){if(direction){return idbObjectStore.openCursor(wrap.range(range),direction);}else{return idbObjectStore.openCursor(wrap.range(range));}},callback);};result.index=function(name){return wrap.index(function(){return idbObjectStore.index(name);});};result.createIndex=function(prop,options,indexName){if(arguments.length===2&&typeof options==="string"){indexName=arguments[1];options=null;}
if(!indexName){indexName=prop;}
return wrap.index(function(){return idbObjectStore.createIndex(indexName,prop,options);});};result.deleteIndex=function(indexName){return idbObjectStore.deleteIndex(indexName);};return result;},"range":function(r){if($.isArray(r)){if(r.length===1){return IDBKeyRange.only(r[0]);}else{return IDBKeyRange.bound(r[0],r[1],(typeof r[2]==='undefined')?false:r[2],(typeof r[3]==='undefined')?false:r[3]);}}else if(typeof r==="undefined"){return null;}else{return r;}},"cursor":function(idbCursor,callback){return $.Deferred(function(dfd){try{var cursorReq=typeof idbCursor==="function"?idbCursor():idbCursor;cursorReq.onsuccess=function(e){if(!cursorReq.result){dfd.resolveWith(cursorReq,[null,e]);return;}
var elem={"delete":function(){return wrap.request(function(){return cursorReq.result["delete"]();});},"update":function(data){return wrap.request(function(){return cursorReq.result["update"](data);});},"next":function(key){this.data=key;},"key":cursorReq.result.key,"value":cursorReq.result.value};dfd.notifyWith(cursorReq,[elem,e]);var result=callback.apply(cursorReq,[elem]);try{if(result===false){dfd.resolveWith(cursorReq,[null,e]);}else if(typeof result==="number"){cursorReq.result["advance"].apply(cursorReq.result,[result]);}else{if(elem.data)cursorReq.result["continue"].apply(cursorReq.result,[elem.data]);else cursorReq.result["continue"]();}}catch(e){dfd.rejectWith(cursorReq,[cursorReq.result,e]);}};cursorReq.onerror=function(e){dfd.rejectWith(cursorReq,[cursorReq.result,e]);};}catch(e){e.type="exception";dfd.rejectWith(cursorReq,[null,e]);}});},"index":function(index){try{var idbIndex=(typeof index==="function"?index():index);}catch(e){idbIndex=null;}
return{"each":function(callback,range,direction){return wrap.cursor(function(){if(direction){return idbIndex.openCursor(wrap.range(range),direction);}else{return idbIndex.openCursor(wrap.range(range));}},callback);},"eachKey":function(callback,range,direction){return wrap.cursor(function(){if(direction){return idbIndex.openKeyCursor(wrap.range(range),direction);}else{return idbIndex.openKeyCursor(wrap.range(range));}},callback);},"get":function(key){if(typeof idbIndex.get==="function"){return wrap.request(idbIndex.get(key));}else{return idbIndex.openCursor(wrap.range(key));}},"count":function(){if(typeof idbIndex.count==="function"){return wrap.request(idbIndex.count());}else{throw "Count not implemented for cursors";}},"getKey":function(key){if(typeof idbIndex.getKey==="function"){return wrap.request(idbIndex.getKey(key));}else{return idbIndex.openKeyCursor(wrap.range(key));}}};}};var dbPromise=wrap.request(function(){return version?indexedDB.open(dbName,parseInt(version)):indexedDB.open(dbName);});dbPromise.then(function(db,e){db.onversionchange=function(){if(!(config&&config.onversionchange&&config.onversionchange()!==false)){db.close();}};},function(error,e){},function(db,e){if(e&&e.type==="upgradeneeded"){if(config&&config.schema){for(var i=e.oldVersion+1;i<=e.newVersion;i++){typeof config.schema[i]==="function"&&config.schema[i].call(this,wrap.transaction(this.transaction));}}
if(config&&typeof config.upgrade==="function"){config.upgrade.call(this,wrap.transaction(this.transaction));}}});return $.extend(dbPromise,{"cmp":function(key1,key2){return indexedDB.cmp(key1,key2);},"deleteDatabase":function(){return $.Deferred(function(dfd){dbPromise.then(function(db,e){db.close();wrap.request(function(){return indexedDB.deleteDatabase(dbName);}).then(function(result,e){dfd.resolveWith(this,[result,e]);},function(error,e){dfd.rejectWith(this,[error,e]);},function(db,e){dfd.notifyWith(this,[db,e]);});},function(error,e){dfd.rejectWith(this,[error,e]);},function(db,e){dfd.notifyWith(this,[db,e]);});});},"transaction":function(storeNames,mode){!$.isArray(storeNames)&&(storeNames=[storeNames]);mode=getDefaultTransaction(mode);return $.Deferred(function(dfd){dbPromise.then(function(db,e){var idbTransaction;try{idbTransaction=db.transaction(storeNames,mode);idbTransaction.onabort=idbTransaction.onerror=function(e){dfd.rejectWith(idbTransaction,[e]);};idbTransaction.oncomplete=function(e){dfd.resolveWith(idbTransaction,[e]);};}catch(e){e.type="exception";dfd.rejectWith(this,[e]);return;}
try{dfd.notifyWith(idbTransaction,[wrap.transaction(idbTransaction)]);}catch(e){e.type="exception";dfd.rejectWith(this,[e]);}},function(err,e){dfd.rejectWith(this,[e,err]);},function(res,e){});});},"objectStore":function(storeName,mode){var me=this,result={};function op(callback){return $.Deferred(function(dfd){function onTransactionProgress(trans,callback){try{callback(trans.objectStore(storeName)).then(function(result,e){dfd.resolveWith(this,[result,e]);},function(err,e){dfd.rejectWith(this,[err,e]);});}catch(e){e.name="exception";dfd.rejectWith(trans,[e,e]);}}
me.transaction(storeName,getDefaultTransaction(mode)).then(function(){},function(err,e){if(err.code===err.NOT_FOUND_ERR&&(mode===true||typeof mode==="object")){var db=this.result;db.close();dbPromise=wrap.request(function(){return indexedDB.open(dbName,(parseInt(db.version,10)||1)+1);});dbPromise.then(function(db,e){db.onversionchange=function(){if(!(config&&config.onversionchange&&config.onversionchange()!==false)){db.close();}};me.transaction(storeName,getDefaultTransaction(mode)).then(function(){},function(err,e){dfd.rejectWith(this,[err,e]);},function(trans,e){onTransactionProgress(trans,callback);});},function(err,e){dfd.rejectWith(this,[err,e]);},function(db,e){if(e.type==="upgradeneeded"){try{db.createObjectStore(storeName,mode===true?{"autoIncrement":true}:mode);}catch(ex){dfd.rejectWith(this,[ex,e]);}}});}else{dfd.rejectWith(this,[err,e]);}},function(trans){onTransactionProgress(trans,callback);});});}
function crudOp(opName,args){return op(function(wrappedObjectStore){return wrappedObjectStore[opName].apply(wrappedObjectStore,args);});}
function indexOp(opName,indexName,args){return op(function(wrappedObjectStore){var index=wrappedObjectStore.index(indexName);return index[opName].apply(index[opName],args);});}
var crud=["add","delete","get","put","clear","count","each"];for(var i=0;i<crud.length;i++){result[crud[i]]=(function(op){return function(){return crudOp(op,arguments);};})(crud[i]);}
result.index=function(indexName){return{"each":function(callback,range,direction){return indexOp("each",indexName,[callback,range,direction]);},"eachKey":function(callback,range,direction){return indexOp("eachKey",indexName,[callback,range,direction]);},"get":function(key){return indexOp("get",indexName,[key]);},"count":function(){return indexOp("count",indexName,[]);},"getKey":function(key){return indexOp("getKey",indexName,[key]);}};};return result;}});}});$.indexedDB.IDBCursor=IDBCursor;$.indexedDB.IDBTransaction=IDBTransaction;$.idb=$.indexedDB;})(jQuery);
/* End of jQuery IndexedDB plugin */

$(document).ready(function(){
	
});


// Nepali datepicker everywhere
try{
	var app = angular.module('bahmni.common.uiHelper');
	
	// Nepali date picker in date type field input
	app.directive('input', function () {
		var link = function ($scope, element, attrs, ngModel) {
			if(element[0].type == 'date'){
				var html = element.parent();
				var customDateField = $('<input type="text" class="customDatePicker" placeholder="Nepali Date" readonly/>');
				customDateField.appendTo(html);
				
				// if value is set translate to nepali and fill the date
				// Get the model that holds the data value
				var model = element.attr('ng-model');
				
				try{
					if(eval('$scope.'+model) != null || eval('$scope.'+model) != 'undefined' && eval('$scope.'+model).getfullYear() != 1970){		
						var adDate = new Date(eval('$scope.'+model));

						var converter = new DateConverter();
						converter.setEnglishDate(adDate.getFullYear(), adDate.getMonth()+1, adDate.getDate());						
						customDateField.val(converter.toNepaliString());
					}
				}catch(e){
					console.log('Error converting to the custom date.');
				}
				
				customDateField.calendarsPicker({
					calendar: $.calendars.instance('nepali'),
					yearRange: '-120:+30',
					duration: "fast",
					showAnim: "",
					dateFormat: 'yyyy-mm-dd',
					onSelect: function(npDate) {
						// Conversion and assignment
						var converter = new DateConverter();
						converter.setNepaliDate(npDate[0]._year, npDate[0]._month, npDate[0]._day)
						customDateField.prev('input').val(converter.toEnglishString());
						customDateField.prev('input').trigger("change");
						customDateField.prev('input').trigger("blur");
					}
				});
			}
		};
		return { link: link };
	});	
	
}catch(e){
	console.log('App not initialized... [bahmni.common.uiHelper]');
}

// Clinical dashboard (display)
try {
	var clinicalApp = angular.module('bahmni.clinical');
	/*
	clinicalApp.directive('input', function () {
		var link = function ($scope, element, attrs, ngModel) {
			if(element[0].type == 'date'){
				var html = element.parent();
				var customDateField = $('<input type="text" class="customDatePicker" placeholder="Nepali Date" readonly/>');
				customDateField.appendTo(html);
				
				// if value is set translate to nepali and fill the date
				// Get the model that holds the data value
				var model = element.attr('ng-model');
				
				try{
					if(eval('$scope.'+model) != null || eval('$scope.'+model) != 'undefined' && eval('$scope.'+model).getfullYear() != 1970){		
						var adDate = new Date(eval('$scope.'+model));

						var converter = new DateConverter();
						converter.setEnglishDate(adDate.getFullYear(), adDate.getMonth()+1, adDate.getDate());						
						customDateField.val(converter.toNepaliString());
					}
				}catch(e){
					console.log('Error converting to the custom date.');
				}
				
				customDateField.calendarsPicker({
					calendar: $.calendars.instance('nepali'),
					yearRange: '-120:+30',
					duration: "fast",
					showAnim: "",
					dateFormat: 'yyyy-mm-dd',
					onSelect: function(npDate) {
						// Conversion and assignment
						var converter = new DateConverter();
						converter.setNepaliDate(npDate[0]._year, npDate[0]._month, npDate[0]._day)
						customDateField.prev('input').val(converter.toEnglishString());
						customDateField.prev('input').trigger("change");
						customDateField.prev('input').trigger("blur");
					}
				});
			}
		};
		return { link: link };
	});
	*/
	

	
	
	// Computed values in the form are wrapped in div tag
	clinicalApp.directive('bahmniObservation', function () {
		var link = function ($scope, element, attrs, ngModel) {
			
			// For computed Value
			/*
			if(element.context.className === 'compuptedValue'){
				// Todo : check for the valid datetime value
				
				var obsValueDateComputed = new Date($scope.observation.value);
				
				// Date Conversion
				var converter = new DateConverter();
				converter.setEnglishDate(obsValueDateComputed.getFullYear(), obsValueDateComputed.getMonth()+1, obsValueDateComputed.getDate());						
				var customDate = converter.toNepaliStringLong();
				// End date conversion
				
				$scope.observation.value = customDate;
			}*/	
			
			//if(element[0].classList[0] == 'dashboard-sections'){
			//	console.log($scope.bahmniObservations);
			//}
			
		};
		return { link: link };
	});
	
	// Minimize form sections
	clinicalApp.directive('button', function () {
		
		var link = function ($scope, element, attrs, ngModel) {
			
			if(element.attr('title') == "{{ ::'CONCEPT_SET_GROUP_COLLAPSE_ALL_KEY' | translate}}"){
				//console.log('Trigger "Collapse All" Event');
				$scope.conceptSet.minimizeInnerSections(event);
				
			}			
		};
		return { link: link };
	});
	
} catch(e) {
    console.log('App not initialized... [bahmni.clinical]');
}


/*********************************************************************************************************/
/*************************************** Custom Display COntrol ******************************************/
/*********************************************************************************************************/

try{
	var displayControl = angular.module('bahmni.common.displaycontrol.custom');
	
	displayControl.run(['$rootScope', '$state', 'observationsService', function ($rootScope, $state, observationsService){
		// Get patient by uuid
		$rootScope.getPatient = function(patientUuid){
			var pt;
			$.indexedDB("Bahmni").objectStore("patient").each(function(pt){
				if(pt.value.value.uuid == patientUuid){
					pt = pt;
				}	
			});
			return pt;
		}
		
		// Get patient by uuid
		$rootScope.getPatientList = function(){
			var patients = $.indexedDB("Bahmni").objectStore("patient");
			return patients;
		}
		
		/* extract leaf observation values from nested concepts/forms */
		var Json = [];
		var parentConcept;
		$rootScope.leafObservations = function(observations) {
			
			$.each(observations, function(i, observation){
				if(observation.hasOwnProperty("groupMembers") && observation !== undefined){
					var temp = {};
					if(observation.concept.set){
						parentConcept = observation.conceptNameToDisplay;
					}
					if(observation.hasOwnProperty('groupMembers') && observation.groupMembers.length > 0){
						$rootScope.leafObservations(observation.groupMembers);
						parentConcept = observation.conceptNameToDisplay;
					}else{
						//console.log(observation);
						temp["conceptName"] = observation.conceptNameToDisplay;
						temp["type"] = observation.type;
						temp["value"] = observation.valueAsString;
						temp["encounterDateTime"] = observation.encounterDateTime;
						temp["provider"] = observation.providers[0].name;
						temp["formName"] = parentConcept;
						Json.push(temp);
						parentConcept = '';
					}
				}
			});
			return Json;
		};
		//
		
		// Date convert to Nepali
		$rootScope.convertDateTime = function(dateTime){
			var converter = new DateConverter();
			dateTime = new Date(dateTime);
			converter.setEnglishDate(dateTime.getFullYear(), dateTime.getMonth()+1, dateTime.getDate());						
			return converter.toNepaliString();
		};
	}]);

	// MNH Monitoring Dashboard
	displayControl.directive('mnhMonitoring', ['$rootScope','observationsService', 'appService', 'spinner', function ($rootScope, observationsService, appService, spinner) {
		var link = function ($scope) {
			
			// content url - the url for html template
			$scope.contentUrl = "../plugins/mnhMonitoring.html";
			$scope.observations = [];
			
			$scope.getPatient = function(patientUuid){
				$.indexedDB("Bahmni").objectStore("patient").each(function(pt){
					if(pt.value.value.uuid == patientUuid){
						$scope.patientDetail = pt.value.value;
					}	
				});
			}
		
			/* extract leaf observation values from nested concepts/forms */
			var finalJson = [];
			$scope.getLeafObservations = function(observations) {
				var parentConcept;
				var encounterDateTime;
				parentConcept = observations.conceptNameToDisplay;
				encounterDateTime = observations.encounterDateTime;
				if(observations.hasOwnProperty("groupMembers") && observations !== undefined){
					$.each(observations.groupMembers, function(key,value){
						var temp = {};
						if(value.concept.set){
								parentConcept = value.conceptNameToDisplay;
							}
						if(value.hasOwnProperty('groupMembers') && value.groupMembers.length > 0){
							$scope.getLeafObservations(value.groupMembers);
						}else{
							temp["conceptName"] = value.conceptNameToDisplay;
							temp["value"] = value.valueAsString;
							temp["encounterDateTime"] = value.encounterDateTime;
							temp["provider"] = value.providers[0].name;
							temp["formName"] = parentConcept;
							$scope.observations.push(temp);
						}
							
					});
				}
			};
			
			//
			
			var conceptNames = [
				"Gravida Para LMP and EDD",
				"Antenetal Checkup Details",
				"HIV and Syphlis Test",
				"Complications Present",
				"Intrapartum and Admission Form",
				"Delivery Form",
				"Newborn Details",
				"PNC Checkup",
				"Blood Transfusion"
			];
			
			$scope.getPatient($scope.patient.uuid);
			console.log($scope.patientDetail);
            
			spinner.forPromise(observationsService.fetch($scope.patient.uuid, conceptNames, "all", undefined, undefined, undefined).then(function (response) {
                var observations = response.data;
				
				
				
				$scope.expectedVisits = ["Fourth Month", "Sixth Month", "Eighth Month", "Ninth Month","Other"];
				
				$.each(observations, function(key, object) {
					$scope.getLeafObservations(object);
				});
				
				console.log($scope.observations);
				
				// Date convert to Nepali
				$scope.convertDateTime = function(dateTime){
					var converter = new DateConverter();
					dateTime = new Date(dateTime);
					converter.setEnglishDate(dateTime.getFullYear(), dateTime.getMonth()+1, dateTime.getDate());						
					return converter.toNepaliString();
				};
				
				// calculate edd
				$scope.calculateEdd = function(lmp){
					var eddArray = [];
					lmp = new Date(lmp);
					var edd = new Date(lmp.setMonth(lmp.getMonth()+9));
					edd = new Date(edd.setDate(edd.getDate()+7));
					
					var converter = new DateConverter();
					converter.setEnglishDate(edd.getFullYear(), edd.getMonth()+1, edd.getDate());
					
					var today = new Date();
					var diffTime = Math.abs(edd - today);
					var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
					
					var diffTime1 = Math.abs(lmp - today);
					var diffDays1 = Math.ceil(diffTime1 / (1000 * 60 * 60 * 24)); 

					eddArray['date'] = converter.toNepaliString();
					eddArray['remainingDays'] = diffDays+" Days";
					eddArray['age'] = Math.round(diffDays1/7)+" Week(s)";
					
					return eddArray;
				};
								
				// Total Iron Folic tablet calculation
				$scope.totalIronFolic = function(data){
					var total = 0;
					$.each(data, function(i, dt) {
						
						if(dt.conceptName == 'Iron Folic' && dt.value!== undefined)
							total += parseInt(dt.value);
					});
					return total;
				};
				
				// ANC as per Protocol
				$scope.ancAsPerProtocol = function(observations){
					var asPerProtocol = false;
					var expected = ["Fourth Month", "Sixth Month", "Eighth Month", "Ninth Month"];
					
					var temp = [];
					$.each(expected, function(index, visit){
						$.each(observations, function(i, dt) {
							if(dt.conceptName == 'ANC Checkup' && dt.value == visit)
								temp[visit] = true;
						});
					});
					if(temp["Fourth Month"] && temp["Sixth Month"] && temp["Eighth Month"] && temp["Ninth Month"]){
						return true;
					}else{
						return false;
					}
				};
				
				// PNC as per protocol
				$scope.expectedPnc = ["First (within 24 hours)", "2nd (within 3 days of delivery)", "3rd (within 7 days of delivery)"];
				$scope.pncAsPerProtocol = function(observations){
					var asPerProtocol = false;
					var temp = [];
					$.each($scope.expectedPnc, function(index, visit){
						$.each(observations, function(i, dt) {
							if(dt.conceptName == "PNC detail" && dt.value == visit)
								temp[visit] = true;
						});
					});
					if(temp["First (within 24 hours)"] && temp["2nd (within 3 days of delivery)"] && temp["3rd (within 7 days of delivery)"]){
						return true;
					}else{
						return false;
					}
				};
				
				// Incentive Eligibility
				$scope.incentiveEligibility = function(observations){
					var eligible = [];
					if($scope.ancAsPerProtocol(observations)){
						eligible['anc'] = true;
					}else{
						eligible['anc'] = false;
					}
					
					if($scope.pncAsPerProtocol(observations)){
						eligible['pnc'] = true;
					}else{
						eligible['pnc'] = false;
					}
					return eligible;
				};
            }));
        };

        return {
            restrict: 'E',
            template: '<ng-include src="contentUrl"/>',
            link: link
        }
    }]);
	
	
	// Disable concept answers based on previous values
	displayControl.directive('conceptSet', ['$rootScope','observationsService', 'appService', 'spinner', function ($rootScope, observationsService, appService, spinner) {
		var link = function ($scope, element, attrs, ngModel) {
			
			var formConceptNames = appService.getAppDescriptor().getConfigValue("formsToGetDataForUICustomization");
				
			spinner.forPromise(observationsService.fetch($scope.patient.uuid, formConceptNames, "all", undefined, undefined, undefined).then(function (response) {	
				var recordedObs = $rootScope.leafObservations(response.data);
				
				// Check each concepts for previous observations, if found disable the option in the anwser list
				var conceptsToCheckForPreviousObs = appService.getAppDescriptor().getConfigValue("conceptsToCheckForPreviousObs");
				$("button.grid-row-element").each(function( index ) {	
					var answerButton = $(this);
					var answerButtonTitle = answerButton.attr('title');
				
					$.each(response.data, function(i, observations){
						if(observations != null && observations != undefined){
							$.each(observations.groupMembers, function(i, obs){
								$.each(conceptsToCheckForPreviousObs, function(x,concept){
									if(obs.conceptNameToDisplay == concept && obs.valueAsString == answerButtonTitle && obs.valueAsString != "Other" && obs.valueAsString != "Additional"){
										answerButton.attr('disabled','true');
									}
								});
							});
						}
					});
				});
				
				// Check each concepts listed in oneTimeObs for previous observations, if found disable the input and display the previous answer
				var oneTimeObs = appService.getAppDescriptor().getConfigValue("mnhOneTimeObs");
				$("input").each(function( index ) {	
					var textInput = $(this);
					$("label").each(function( i ) {
						if($(this).attr('for') != undefined && textInput.attr('id') != undefined && $(this).attr('for') == textInput.attr('id')){
							var c = $(this).children()[0].innerHTML;
							$.each(recordedObs, function(k, o){
								if(o.conceptName == c && oneTimeObs.includes(c)){
									var val = (o.type == 'Date')? $rootScope.convertDateTime(new Date(o.value)): o.value;
									textInput.after( "<div title='"+$rootScope.convertDateTime(o.encounterDateTime)+"'>"+val+" | "+$rootScope.convertDateTime(o.encounterDateTime)+"</div>");
									textInput.parent().children('input').css('display','none');
									textInput.css('display','none');
								}
							});
						}
					});
				});
			}));			
		};
		return { link: link };
	}]);
	
	
	// Values wrapped in span tag (Encounter Date, visit paginator-visit-date)
	displayControl.directive('span', function () {
		var link = function ($scope, element, attrs, ngModel) {
			
			// For patient dashboard - encounter datetime
			if(element.context.className === 'obs-date'){
				var encDate = new Date($scope.obsGroup.value[0].encounterDateTime);
				
				// Date conversion
				var converter = new DateConverter();
				converter.setEnglishDate(encDate.getFullYear(), encDate.getMonth()+1, encDate.getDate());						
				var customDate = converter.toNepaliStringLong();
				// End date conversion
				
				//element.html(customDate);
				$scope.obsGroup.date = customDate;
			}
			
			
			// For patient dashboard - Diagnosis datetime
			if(element.attr('id') === 'diagnosisDate'){
				var diagDate = new Date($scope.diagnosis.diagnosisDateTime);
				
				// Date Conversion
				var converter = new DateConverter();
				converter.setEnglishDate(diagDate.getFullYear(), diagDate.getMonth()+1, diagDate.getDate());						
				var customDate = converter.toNepaliStringLong();
				// End date conversion
				
				$scope.diagnosis.diagnosisDateTime = customDate;
				
				if($scope.diagnosis.hasOwnProperty('latestDiagnosis') && $scope.diagnosis.latestDiagnosis != null){
					$scope.diagnosis.latestDiagnosis.diagnosisDateTime = customDate;
				}
			}
			
			// Visit summary page
			if(element.context.className === 'visit-date'){
				var startDateCustom_formatted;
				var stopDateCustom_formatted;
				
				// for visit start date				
				var startDate = new Date($scope.visitSummary.startDateTime);
				
				// Date Conversion
				var converter = new DateConverter();
				converter.setEnglishDate(startDate.getFullYear(), startDate.getMonth()+1, startDate.getDate());						
				var customDate = converter.toNepaliStringLong();
				// End date conversion
				
				$scope.visitSummary.startDateTime = customDate;
				//element.context.children[0].innerHTML = startDateCustom_formatted;
				
				// for visit stop date
				if($scope.visitSummary.hasOwnProperty('stopDateTime') && $scope.visitSummary.stopDateTime != null){
					var endDate = new Date($scope.visitSummary.stopDateTime);
					
					// Date Conversion
					var converter = new DateConverter();
					converter.setEnglishDate(endDate.getFullYear(), endDate.getMonth()+1, endDate.getDate());						
					var customDate = converter.toNepaliStringLong();
					// End date conversion
					$scope.visitSummary.stopDateTime = customDate
					
					//element.context.children[1].innerHTML = stopDateCustom_formatted;

				}				
			}
		};
		return { link: link };
	});


	// List of visits are wrapped in a tag with class name 'visit'
	displayControl.directive('a', function () {
		
		var link = function ($scope, element, attrs, ngModel) {
			// Patient dashboard, visit list
			
			if(element.context.className === 'visit'){
				
				var model = element.attr('ng-model');
				// for visit start date
				var startDate = new Date($scope.visit.startDatetime);
				
				// Date conversion
				var converter = new DateConverter();
				converter.setEnglishDate(startDate.getFullYear(), startDate.getMonth()+1, startDate.getDate());		
				var customDate = converter.toNepaliStringLong();
				// End date conversion
				
				$scope.visit.startDatetime = customDate;
				
				// for visit end date
				if($scope.visit.hasOwnProperty('stopDatetime') && $scope.visit.stopDatetime != null){
					var endDate = new Date($scope.visit.stopDatetime);
					// Date conversion
					var converter = new DateConverter();
					converter.setEnglishDate(endDate.getFullYear(), endDate.getMonth()+1, endDate.getDate());
					var customDate = converter.toNepaliStringLong();
					// End date conversion
					
					$scope.visit.stopDatetime = customDate;
				}
			}			
		};
		return { link: link };
	});

	// Observation values of date type in the patient dashboard are wrapped in pre tag
	displayControl.directive('pre', function () {
		var link = function ($scope, element, attrs, ngModel) {
			// for observation values of date type
			if(typeof $scope !== 'undefined' && typeof $scope.observation !== 'undefined'){
				if($scope.observation.hasOwnProperty('groupMembers') && $scope.observation.groupMembers != null){
					if($scope.observation.concept.dataType == 'Date'){
						var obsValueDate = new Date($scope.observation.value);
						
						// Date Conversion
						var converter = new DateConverter();
						converter.setEnglishDate(obsValueDate.getFullYear(), obsValueDate.getMonth()+1, obsValueDate.getDate());						
						var customDate = converter.toNepaliStringLong();
						// End date conversion
						
						$scope.observation.value = customDate;
					}
				}
			}	
		};
		return { link: link };
	});


	// SummaryDashboard
	displayControl.directive('div', ['$rootScope','observationsService', 'appService', 'spinner', '$compile', function ($rootScope, observationsService, appService, spinner, $compile) {
		var link = function ($scope, element, attrs, ngModel) {
			if(element.context.className === 'patient-search-wrapper'){
				//var summaries = appService.getAppDescriptor().getConfigValue("summaries");
				var myPatients = $rootScope.getPatientList();
				
				var conceptNames = [
					"Gravida Para LMP and EDD",
					"Antenetal Checkup Details",
					"HIV and Syphlis Test",
					"Complications Present",
					"Intrapartum and Admission Form",
					"Delivery Form",
					"Newborn Details",
					"PNC Checkup"
				];
				
				// Patients with complication
				$scope.summaryData = {};
				var patientWithComplications;
				myPatients.each(function(pt){
					var temp = {};
					spinner.forPromise(observationsService.fetch(pt.value.value.uuid, conceptNames, "all", undefined, undefined, undefined).then(function (response) {
						var patientObs = $rootScope.leafObservations(response.data);
						console.log(patientObs);
						var complication = false;
						$.each(patientObs, function(j,obs){					
							if(obs.conceptName == 'Complication'){
								complication = true;
							}
						});
						if(complication){
							patientWithComplications++
						}
					}));
					$scope.summaryData['Complication'] = patientWithComplications;
				});
				
				$scope.contentUrl = "../plugins/summary.html";
				
				var newHtml = $compile("<ng-include src=\"'"+$scope.contentUrl+"'\"></ng-include>")($scope)
				$(element[0]).after(newHtml);
			}
		};
        return {
            link: link
		}
    }]);
} catch(e){
	console.log('Error Occured : '+e);
}
