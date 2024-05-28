var modal = document.getElementById("myModal");
var selectedcellData = '';

var span = document.getElementsByClassName("close")[0];
var textArea = document.getElementById("text-area");
var okBtn = document.getElementById("okBtn");

okBtn.onclick = function () {
  var graph = window.editorUiObj.editor.graph;
  var value = graph.getModel().getValue(selectedcellData);
  if (!window.mxUtils.isNode(value)) {
    var doc = window.mxUtils.createXmlDocument();
    var obj = doc.createElement('object');
    obj.setAttribute('label', value || '');
    value = obj;
  }


  value = value.cloneNode(true);
  var removeLabel = false;
  var names = ['jsonData'];
  if(window.jsTreeDropdownData) {
    for (var i = 0; i < names.length; i++) {
      value.setAttribute(names[i], window.jsTreeDropdownData);
      removeLabel = removeLabel || (names[i] == 'placeholder' &&
        value.getAttribute('placeholders') == '1');
    }
  }
  else {
    for (var i = 0; i < names.length; i++) {

      value.setAttribute(names[i], textArea.value ? textArea.value : '');
      removeLabel = removeLabel || (names[i] == 'placeholder' &&
        value.getAttribute('placeholders') == '1');
    }
  
    if (removeLabel) {
      value.removeAttribute('label');
    }
    if(textArea) textArea.value = '';
  }

  graph.getModel().setValue(selectedcellData, value);
  modal.style.display = "none";

}

span.onclick = function () {
  closeModal();
}

window.onclick = function (event) {
  if (event.target == modal) {
    closeModal();
  }
}

function openModal() {
  modal.style.display = "block";
  callJsTreeAPI();
}

function closeModal() {
  modal.style.display = "none";
}


function triggerModalFromJs(cellData) {
  selectedcellData = cellData;
  openModal();
}