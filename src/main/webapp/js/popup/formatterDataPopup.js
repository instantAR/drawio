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

var queryBuilderArray = ["Round off",
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
        let cellAttributesData = null;
        cellAttributesData = getJsonDataFromCell(resultCell[0]);
        if (cellAttributesData?.jsonData) {
          const filters = formatterJsonToFilterArray(cellAttributesData.jsonData);
          $(document).ready(function () {
            if ($('#formatter-builder').data('queryBuilder')) {
              $('#formatter-builder').queryBuilder('destroy');
            }
            $('#formatter-builder').queryBuilder({
              operators,
              filters
            });
            setAddDeleteRuleOrGroup();
            $('#formatter-builder').on('afterAddRule.queryBuilder', function(e, rule) {
              setAddDeleteRuleOrGroup();
            });
          });
        }
        else {
          formattermodal.style.display = "none";
          alert("source data not found");
        }
      }
      else {
        let cellAttributesData = null;
        let allSourceDataJSON = [];
        for(var i=0;i<resultCell.length;i++) {
          cellAttributesData = getJsonDataFromCell(resultCell[i]);
          if(cellAttributesData?.jsonData) {
            allSourceDataJSON.push(cellAttributesData.jsonData);
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
                      setAddDeleteRuleOrGroup();
                      $('#formatter-builder').on('afterAddRule.queryBuilder', function(e, rule) {
                        setAddDeleteRuleOrGroup();
                      });
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

function formatterJsonToFilterArray(json, isMultipleSourceData = false) {
  let filters = [];
  const sourcBlockData = isMultipleSourceData ? json : Object.values(json)[0];
  if (sourcBlockData && Array.isArray(sourcBlockData)) {
    filters.push(...sourcBlockData.map(source => ({
      id: source.id,
      label: formatLabel(source.value),
      type: mapType(source[source.value]),
      operators: queryBuilderArray
    })));
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

