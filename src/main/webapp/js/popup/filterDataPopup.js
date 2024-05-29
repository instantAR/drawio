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
      const filters = jsonToFilterArray(jsonData);
      $(document).ready(function() {
        if ($('#builder').data('queryBuilder')) {
          $('#builder').queryBuilder('destroy');
      }
        $('#builder').queryBuilder({
            filters: filters
        });
    
        $('#btn-get').on('click', function() {
            var result = $('#builder').queryBuilder('getRules');
            if (!$.isEmptyObject(result)) {
                $('#output').text(JSON.stringify(result, null, 2));
            } else {
                $('#output').text('No query defined.');
            }
        });
    });
    }
    else {
      filtermodal.style.display = "none";
      alert("=======source data not found");
    }
  }
}

function closeFilterModal() {
  filtermodal.style.display = "none";
}


function filtermodalOpen(cellData) {
  selectedcellData = cellData;
  console.log("=========selectedcellData filter data cell",selectedcellData);
  openFilterModal();
}

function getJsonDataFromCell(cell) {
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

function jsonToFilterArray(json) {
  let filters = [];
  const data = Object.values(json)[0];
  
  for (const key in data) {
      if (data.hasOwnProperty(key)) {
          filters.push({
              id: key,
              label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
              type: mapType(data[key])
          });
      }
  }

  return filters;
}

