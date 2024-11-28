function resetOurPurposeButtons(){
	setVar('var_ourPurposeChoiceArray','{"order_array" : []}');//reset the button count object
}

function saveButtonOrderArray(arrOpca){
			//save the variable back to storyline as String
			var obj = {
				order_array: arrOpca
			};
			strData = JSON.stringify(obj);
			setVar('var_ourPurposeChoiceArray',strData);
			isSet = true;	
}

function replaceArrayItem(_array,_find,_replacement){
	var index = _array.indexOf(_find);

	if (index !== -1) {
    	_array[index] = _replacement;
	}
	return index;
}

function manageButtonState(arr, id ){
	//when to let a click through
	//when there are no items in the array
	//when the array contains -1 
	//when the btnid for the btn clicked is in the array

	//when not to let a click through
	//when there are 3 items in the array and none of them are -1 and the btnid of btn clickd is not in array


	if(arr.length == 3 && arr.includes(-1)==false && arr.includes(id)==false)
	{
		setVar('var_btnState_'+ id,0);//inactive the button
		return false
	
	}else{
		setVar('var_btnState_'+ id,1);//active the button
		return true
	}
	
}
function setOurPurposeButton(btnId){	
	var isSet = false;
	var strOpca = getVar('var_ourPurposeChoiceArray');
	if(strOpca == '') return isSet;
	if(typeof strOpca != 'string')return isSet;
	var arrOpca = JSON.parse(strOpca).order_array;//get the variable as array	
	if(arrOpca.includes(btnId)){
		//the item selected is already in the list. In this case we remove the item so a different one can be added in it's place.
		manageButtonState(arrOpca, btnId );
		index = replaceArrayItem(arrOpca,btnId,-1); //remove the item from the array
		saveButtonOrderArray(arrOpca); //save the updated data
		
		displayTextBoxNumbering(arrOpca,btnId,"");//since the button id was removed from the array, also remove the number displayed on the button
		return true;
	}else if(arrOpca.includes(-1)){
		//there is an item missing from the array represented by -1 and it needs to be replaced with the button that was just clicked
		//update the interface before updating the array
		manageButtonState(arrOpca, btnId );//not necessary, the default functionality covers this case
		displayTextBoxNumbering(arrOpca,btnId,arrOpca[arrOpca.indexOf(-1)]);//handles the 2nd and 3rd click case
		arrOpca[arrOpca.indexOf(-1)] = btnId; //replace button id in button array
		saveButtonOrderArray(arrOpca); //save the updated data	

		return true;
	}

	if(arrOpca.length < 3){
		//dont push it if it is already there, take it out instead
		if(!arrOpca.includes(btnId)){ 
			arrOpca.push(btnId);
		}	
	}
	
	displayTextBoxNumbering(arrOpca,btnId,btnId);//handles the 1st click case
	manageButtonState(arrOpca, btnId );	
	saveButtonOrderArray(arrOpca);
	return isSet;
}

function displayTextBoxNumbering(arr,id,position){
	try{
		//deal with the internal storyline variables so that I can display the selections
		//since we do not have access directly to the elements on the page we have to assign variables to the elememts
		//and then access the variables instead
		//use arr var here to show the order of the selections
		strVarToSet = 'txt'+ id;//the array contains the boxes that are clicked and the position in the array is the order it was clicked
		txt = arr.indexOf(position)+1
		if(txt == 0){txt = ""}
		setVar(strVarToSet,txt);
	}catch{
		console.log('error in displayTextBoxNumbering()');
	}
	}

function setVar(strVarNameToSet,strVarValueToSet){
	var player = GetPlayer();//get player	
	if(varExists(strVarNameToSet)){
		//save the data to the cache in the course
		player.SetVar(strVarNameToSet,strVarValueToSet);
		//save the data to the LMS
		API.LMSSetValue("cmi.objectives.0.id", strVarNameToSet);
		API.LMSSetValue("cmi.objectives.0.student_data", strVarValueToSet);
	}else{console.log('unable to set ' + strVarNameToSet + ' doesn\'t exist.')}
}

function getVar(strVariableToGet){
	var _variable = null;
	try{
		var player = GetPlayer();//get player
		_variable = player.GetVar(strVariableToGet);
	}catch{
		console.log('error in getVar getting ' + ' ' + strVariableToGet);
	}	

	return _variable;
}
function varExists(checkVar){	
	isValid = false;
	try{
		if(getVar(checkVar) != null){
			console.log('variable exists');
			isValid = true;
		}else{
			console.log('variable does not exist');
		}
	}catch{
		console.log('error, function call was empty');
	}
	
	return isValid;
}