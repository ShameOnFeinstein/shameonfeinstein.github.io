
window.viz ={};
window.viz.signature_count = 0;
window.viz.signature_count_redacted = 0;


window.viz.getSignatures = function(){
  return $.ajax({
    url:"/signatures",
    dataType:'json',
  }).success(function(data){
    console.log(data);
    //We had some data contaimination with non-CA zips durng the first ~500 singatures filter them out
    window.viz.signature_count = data.filter(function(x){return isValidCAZip(x.zip_code);}).length;
    window.viz.signature_data = data.filter(function(x){return isValidCAZip(x.zip_code);});
  });
}

window.viz.getSingaturesRedacted = function(){
  return $.ajax({
    url:"/signatures_redacted",
    dataType:'json',
  }).success(function(data){
    console.log(data);
    //We had some data contaimination with non-CA zips durng the first ~500 singatures filter them out
    window.viz.signature_count_redacted = data.filter(function(x){return isValidCAZip(x.zip_code);}).length;
    window.viz.signature_redacted_data = data.filter(function(x){return isValidCAZip(x.zip_code);});
  });

}


window.viz.updateSignatureCount = function(total_count){
  setTimeout(function(){$('#sig_number').text(total_count).fadeIn("slow");},100); 
  setTimeout(function(){$('#sig_number_2').text(total_count).fadeIn("slow");},100); 
};

window.viz.isObfuscatedSig = function(sigdata){
  if (sigdata.firstLen === undefined){
    return false;
  }
  if (sigdata.first === undefined){
    return true;
  }
};

viz.sigDateCompare = function (a,b){

  if (Date.parse(a.date.split(".")[0]) < Date.parse(b.date.split(".")[0])){ return -1;} //Truncate the string after so that it can be parsed in both Chrome, FF and legacy browsers
  if (Date.parse(a.date.split(".")[0]) > Date.parse(b.date.split(".")[0])){ return 1;}
  return 0;
}


window.viz.displayData = function(){
      viz.updateSignatureCount(window.viz.signature_count + window.viz.signature_count_redacted);
      if (window.Worker){
        setTimeout(function(){viz.orderSignaturesWithWorker();},100);
      }
      else{
        setTimeout(function(){viz.orderSignatures();},100);
      }
      
}



window.viz.displaySignature = function(sigdata,col_id,timedelay){
  if (viz.isObfuscatedSig(sigdata)){
    var obfuscationString = "REDACTED"
    while (obfuscationString.length <= sigdata.firstLen || obfuscationString <= sigdata.lastLen ){obfuscationString +=obfuscationString;}
    var sigcontainer = $('<div>',{id:"sigcontainer",class:"sigcontainer"});
    var firstname = $('<div>',{id:"firstname",class:"redacted"}).text(obfuscationString.substring(0,sigdata.firstLen));
    var br = $('<br>',{id:"break",class:""});
    var lastname = $('<div>',{id:"lastname",class:"redacted"}).text(obfuscationString.substring(0,sigdata.lastLen));
    var zip = $('<div>',{id:"zip"}).text(sigdata.zip_code);
    var sigcontents = sigcontainer.append(firstname).append(br).append(lastname).append(zip);
    return setTimeout(function (){$('#subcol'+(col_id).toString()).append(sigcontents).children("#sigcontainer").show("slow").fadeIn("slow");},500*timedelay)
  }
  else {
    var sigcontainer = $('<div>',{id:"sigcontainer",class:"sigcontainer"});
    var firstname = $('<div>',{id:"firstname",class:""}).text(sigdata.first);
    var lastname = $('<div>',{id:"lastname",class:""}).text(sigdata.last);
    var zip = $('<div>',{id:"zip"}).text(sigdata.zip_code);
    if (sigdata.first === ""){ firstname = $('<br/>');}
    if (sigdata.last === ""){ lastname = $('<br/>');}
    var sigcontents =sigcontainer.append(firstname).append(lastname).append(zip);
    return setTimeout(function (){$('#subcol'+(col_id).toString() ).append(sigcontents).children('#sigcontainer').show("slow").fadeIn("slow");;},500*timedelay)
  }
};


window.viz.displayableSig = function(sig_item){
  if((sig_item.firstLen > 0 || sig_item.lastLen > 0 || sig_item.first !== "" || sig_item.first !== "") && isValidCAZip(sig_item.zip_code)){return true;}
  return false;
}

window.viz.orderSignatures = function(){
    // var column = $('<div>',{id:"subcol",class:"col-sm-2"});
    var sig_data = viz.signature_data.concat(viz.signature_redacted_data);
    var sig_data_sorted = sig_data.sort(viz.sigDateCompare);
    var i = 0;
    var col_id=0;
    while (sig_data_sorted.length !== 0){
      var data_item =sig_data_sorted.pop();
      if (viz.displayableSig(data_item)){
      if(i%3 === 0){
       col_id +=1;
        var column = $('<div>',{id:"subcol" +(col_id).toString(),class:"col-sm-2"});
        // setTimeout(function(){$("#signhead").append(column)},100*(i+1));
      $("#signhead").append(column);
      }
      viz.displaySignature(data_item,col_id,i+1);
      i++;
      
        // if(i%3 ===0 && i > 2){
        // setTimeout(function(x){$("#signhead >.sigcontainer").wrapAll(column);},50*(i+1));
        // }
      } 
    }
        setTimeout(function(x){$("#sig_elipse").hide("slow");},500*(i+1));
}

window.viz.orderSignaturesWithWorker = function(){
      var sig_data = viz.signature_data.concat(viz.signature_redacted_data);
      var sortWorker = new Worker('js/doSort.js')
      sortWorker.addEventListener('message', function(e) {
        var i = 0;
        var col_id=0;
        while (e.data.length !== 0 ){
          var data_item =e.data.pop();
          if (viz.displayableSig(data_item)){
          if(i%3 === 0){
          col_id +=1;
        var column = $('<div>',{id:"subcol" +(col_id).toString(),class:"col-sm-2"});
        $("#signhead").append(column);
          }
        viz.displaySignature(data_item,col_id,i+1);
        i++;
          }
        }
        setTimeout(function(x){$("#sig_elipse").hide("slow");},500*(i+1));

      }, false);
      sortWorker.postMessage(sig_data)
}


$( document ).ready( function(){
  $.when(viz.getSignatures(), viz.getSingaturesRedacted() ).then(function(x){viz.displayData();});
  // viz.orderSignatures();
  // $('.alert').hide();
} );

