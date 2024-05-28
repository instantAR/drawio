var filtermodal = document.getElementById("filterDataModal");
var selectedcellData = '';
var operations = [
  "Validation",
  "!=",
  "Starts with",
  "Does not starts with",
  "Like",
  "Does not like",
  "Ends with",
  "Does not end with",
  "Contains",
  "Does not contain",
  "In Value list",
  "Not in value list",
  "Enriching",
  "Round off",
  "Length validation",
  "Padding",
  "Trimming",
  "Formatting",
  "Concatenation",
  "Substring",
  "Data Type Conversion",
  "Default Value",
  "Masking",
  "Case Conversion"
];
var span = document.getElementById("close-filterModal");
var filterOkBtn = document.getElementById("filterOkBtn");

filterOkBtn.onclick = function () {
  filtermodal.style.display = "none";
}

span.onclick = function () {
  closeFilterModal();
}

window.onclick = function (event) {
  if (event.target == filtermodal) {
    closeFilterModal();
  }
}

function openFilterModal() {
  filtermodal.style.display = "block";
  if(selectedcellData?.edges?.length) {
    const parentData = window.editorUiObj.editor.graph.getModel().getValue(window.editorUiObj.editor.graph.getModel().getTerminal(selectedcellData.edges[0],true));
    let jsonData = null;
    var selectedCell = window.editorUiObj.editor.graph.getModel().getTerminal(selectedcellData.edges[0],true);
    jsonData = getJsonDataFromCell(selectedCell);
    console.log(jsonData);
    if(jsonData) {
      var select = document.getElementById("keyData");
      var operationSelect = document.getElementById("operations");
      Object.keys(jsonData).forEach(function(parentKey) {
        var keys = Object.keys(jsonData[parentKey]);
        select.innerHTML = '';
        keys.forEach(function(key) {
            var option = document.createElement("option");
            option.value = key;
            option.text = key;
            select.appendChild(option);
        });
    });

    operations.forEach(function(option) {
         var optionElement = document.createElement("option");
         optionElement.value = option;
         optionElement.text = option;
         operationSelect.appendChild(optionElement);
     });
    }
  }
}

function closeFilterModal() {
  filtermodal.style.display = "none";
}


function filtermodalOpen(cellData) {
  selectedcellData = cellData;
  openFilterModal();
}

function getJsonDataFromCell(cell) {
  if (cell && cell.getValue()) {
    var value = cell.getValue();

    if (mxUtils.isNode(value)) {
      var jsonDataString = value.getAttribute('jsonData');
      var jsonData = JSON.parse(jsonDataString);

      return jsonData;
    } else {
      console.error("The cell value is not an XML node.");
    }
  } else {
    console.error("The cell is empty or does not have a value.");
  }
  return null;
}

