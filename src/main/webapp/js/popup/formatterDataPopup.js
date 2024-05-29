var formattermodal = document.getElementById("formatterDataModal");
var selectedcellData = '';
var operators = [
    { type: 'Round off', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Length validation', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Padding', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Trimming', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Formatting', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Concatenation', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Substring', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Data Type Conversion', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Default Value', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Masking', nb_inputs: 1, apply_to: ['string'] },
    { type: 'Case Conversion', nb_inputs: 1, apply_to: ['string'] },
];
var span = document.getElementById("close-formatterModal");
var formatterOkBtn = document.getElementById("formatterOkBtn");

formatterOkBtn.onclick = function () {
  formattermodal.style.display = "none";
}

span.onclick = function () {
  closeformatterModal();
}

window.onclick = function (event) {
  if (event.target == formattermodal) {
    closeformatterModal();
  }
}

function openformatterModal() {
  formattermodal.style.display = "block";
  if(selectedcellData?.edges?.length) {
    const parentData = window.editorUiObj.editor.graph.getModel().getValue(window.editorUiObj.editor.graph.getModel().getTerminal(selectedcellData.edges[0],true));
    let jsonData = null;
    var selectedCell = window.editorUiObj.editor.graph.getModel().getTerminal(selectedcellData.edges[0],true);

    jsonData = getJsonDataFromCellFormatter(selectedCell);
    console.log(jsonData);
    if(jsonData) {
      const filters = formatterJsonToFilterArray(jsonData);
      $(document).ready(function() {

            if ($('#formatter-builder').data('queryBuilder')) {
              $('#formatter-builder').queryBuilder('destroy');
          }
            $('#formatter-builder').queryBuilder({
                operators,
                filters
            });
    });
    }
    else {
        formattermodal.style.display = "none";
        alert("=======source data not found");
      }
  }
}

function closeformatterModal() {
  formattermodal.style.display = "none";
}


function formattermodalOpen(cellData) {
  selectedcellData = cellData;
  console.log("=========selectedcellData formatter data cell",selectedcellData);

  openformatterModal();
}

function getJsonDataFromCellFormatter(cell) {
  if (cell && cell.getValue()) {
    var value = cell.getValue();

    if (mxUtils.isNode(value)) {
      var jsonDataString = value.getAttribute('jsonData');
      var jsonData;
      try {
        jsonData = JSON.parse(jsonDataString);
      } catch (e) {
        jsonData = {'New' : { [jsonDataString] : 'string'}};
      }

      return jsonData;
    } else {
      console.error("The cell value is not an XML node.");
    }
  } else {
    console.error("The cell is empty or does not have a value.");
  }
  return null;
}

function mapType(type) {
  switch(type) {
      case 'number':
          return 'integer';
      case 'string':
          return 'string';
      case 'boolean':
          return 'boolean';
      default:
          return type;
  }
}

function formatterJsonToFilterArray(json) {
  let filters = [];
  const data = Object.values(json)[0];
  
  for (const key in data) {
      if (data.hasOwnProperty(key)) {
          filters.push({
              id: key,
              label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
              type: mapType(data[key]),
              operators: ["Round off",
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
                        ]
          });
      }
  }

  return filters;
}
