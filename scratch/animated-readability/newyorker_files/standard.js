var mboxCurrent=mboxFactories.get('default').get('target-global-mbox',0);mboxCurrent.setEventTime('include.start');document.write('<div style="visibility: hidden; display: none" id="mboxImported-default-target-global-mbox-0">');/* Offer id: 66274*/ 

 _mboxDefaultContentOffer = function() {
  this._onLoad = function() {};
 };

 _mboxDefaultContentOffer.prototype.setOnLoad = function(_onLoad) {
  this._onLoad = _onLoad;
 };

 _mboxDefaultContentOffer.prototype.show = function(_mbox) {
  var _defaultDiv = _mbox.getDefaultDiv();
  if (_defaultDiv == null) {
   return 0;
  }
  _defaultDiv.onclick = function() {
   // just use _mbox.getName() when everyone is on mboxVersion >= 21
   var _mboxName = _mbox.getName ? _mbox.getName() : _mbox.id;
   var _clickDiv = document.getElementById('mboxClick-' + _mboxName);
   if (_clickDiv != null) {
    _clickDiv.onclick();
   }
  };
  var _result = _mbox.hide();
  if (_result == 1) {
   this._onLoad();
  }
  return _result;
 };

 mboxCurrent.setOffer(new _mboxDefaultContentOffer());
 if (mboxCurrent.getFetcher && mboxCurrent.getFetcher().getType() == 'ajax') {
  mboxCurrent.show();
 };document.write('<!-- Offer Id: 66298  --><script type=\"text\/javascript\">\r\n\/*mboxHighlight+ (1of2) v1 ==> Response Plugin*\/\r\nwindow.ttMETA=(typeof(window.ttMETA)!=\'undefined\')?window.ttMETA:[];window.ttMETA.push({\'mbox\':\'target-global-mbox\',\'campaign\':\'New Yorker Outbrain Module Test\',\'experience\':\'Exp-A-1426716597318\',\'offer\':\'Default Content\'});window.ttMBX=function(x){var mbxList=[];for(i=0;i<ttMETA.length;i++){if(ttMETA[i].mbox==x.getName()){mbxList.push(ttMETA[i])}}return mbxList[x.getId()]}\r\n<\/script>');document.write('<!-- Offer Id: 70565  --><script type=\"text\/javascript\">\r\n\/*T&T to SiteCat v4 ==>Response Plugin*\/\r\nwindow.s_tnt=window.s_tnt||\'\',tntVal=\'73459:0:0,\';\r\nif (window.s_tnt.indexOf(tntVal)==-1){window.s_tnt+=tntVal}\r\nif (mboxCurrent.getFetcher().getType()==\'ajax\'&&(window.s &&\r\nwindow.s.tl)){s.tl(\'TnT\', \'o\', \'TnT\');}\r\n<\/script>');document.write('</div>');mboxCurrent.setEventTime('include.end');mboxFactories.get('default').get('target-global-mbox',0).loaded();mboxFactories.get('default').getPCId().forceId("1425003657815-356301.19_30");