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
    var resultCell = traverseGraph(selectedcellData);

    if(resultCell) {
      if (resultCell.length === 1) {
        $('#formatter-select-source-wrapper').css('display', 'none');
        let jsonData = null;
        jsonData = getJsonDataFromCell(resultCell[0]);
        if (jsonData) {
          const filters = formatterJsonToFilterArray(jsonData);
          $(document).ready(function () {
            if ($('#formatter-builder').data('queryBuilder')) {
              $('#formatter-builder').queryBuilder('destroy');
            }
            $('#formatter-builder').queryBuilder({
              operators,
              filters
            });
            $('select[name^="formatter-builder_rule_"]').css('max-width', '250px');
          });
        }
        else {
          formattermodal.style.display = "none";
          alert("source data not found");
        }
      }
      else {
        let jsonData = null;
        let allSourceDataJSON = [];
        for(var i=0;i<resultCell.length;i++) {
          jsonData = getJsonDataFromCell(resultCell[i]);
          if(jsonData) {
            allSourceDataJSON.push(jsonData);
          }
        }
        if(allSourceDataJSON?.length) {
          $('#formatter-select-source-wrapper').css('display', 'flex');
          const select = $('#formatter-select-source');
          select.empty();
  
          const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.text = "Select an option";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.append(defaultOption);
  
          allSourceDataJSON.forEach(function(item) {
                  const parentKey = Object.keys(item)[0];
                  const value = JSON.stringify(item[parentKey]);
  
                  const option = document.createElement("option");
                  option.value = value;
                  option.text = parentKey;
  
                  select.append(option);
              });
  
              // Example of handling the selection
              $('#formatter-select-source').on('change', function() {
                  const selectedValue = $(this).val();
                  if (selectedValue) {
                    const filters = formatterJsonToFilterArray(JSON.parse(selectedValue),true);
                    $(document).ready(function () {
                      if ($('#formatter-builder').data('queryBuilder')) {
                        $('#formatter-builder').queryBuilder('destroy');
                      }
                      $('#formatter-builder').queryBuilder({
                        operators,
                        filters
                      });
                      $('select[name^="formatter-builder_rule_"]').css('max-width', '250px');
                    });
                  }
              });
        }
        else {
          formattermodal.style.display = "none";
          alert("source data not found");
        }
      }
    }
  }
  else {
    formattermodal.style.display = "none";
  }
}

function closeformatterModal() {
  formattermodal.style.display = "none";
}


function formattermodalOpen(cellData) {
  selectedcellData = cellData;

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

function formatterJsonToFilterArray(json,isMultipleSourceData = false) {
  let filters = [];
  let data;
  if(isMultipleSourceData) {
    data = json;
  }
  else {
    data = Object.values(json)[0];
  }
  
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

function countEdges(cell) {
  var model = window.editorUiObj.editor.graph.getModel();
  var incomingEdges = 0;
  var incomingEdgesData = [];
  var outgoingEdges = 0;
  var outgoingEdgesData = [];

  // Get all edges connected to the cell
  var edges = model.getEdges(cell);

  // Loop through each edge to determine if it's incoming or outgoing
  for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];

      // Get the source and target terminals of the edge
      var source = model.getTerminal(edge, true); // true for source
      var target = model.getTerminal(edge, false); // false for target

      // Check if the clicked cell is the source or target
      if (source === cell) {
          outgoingEdges++;
          outgoingEdgesData.push(source);
      } else if (target === cell) {
          incomingEdges++;
          incomingEdgesData.push(target);
      }
  }

  return {
      incoming: incomingEdges,
      outgoing: outgoingEdges,
      incomingEdgesData: incomingEdgesData,
      outgoingEdgesData: outgoingEdgesData,
  };
}

function traverseGraph(cell, sourceDataCells = [], visited = new Set()) {
  var model = window.editorUiObj.editor.graph.getModel();

  if (!visited.has(cell)) {
    visited.add(cell);
    if (cell.style.includes('source_data')) {
      sourceDataCells.push(cell);
    }

    if (cell.edges?.length) {

      for (var i = 0; i < cell.edges.length; i++) {
        var edge = cell.edges[i];
        var connectedCellIncoming = model.getTerminal(edge, true);
        if (connectedCellIncoming && !visited.has(connectedCellIncoming)) {
          traverseGraph(connectedCellIncoming, sourceDataCells, visited);
        }
      }
    }
  }
  return sourceDataCells;
}

