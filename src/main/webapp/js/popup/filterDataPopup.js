var filtermodal = document.getElementById("filterDataModal");
var selectedcellData = '';
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

  if (!$('#builder').data('queryBuilder')) {
    $('#btn-get-query').css('display', 'none');
    $('#output').css('display', 'none');
    $('.copy-btn').css('display', 'none');
  }

  if (selectedcellData?.edges?.length) {
    var edgeCounts = countEdges(selectedcellData);
    var resultCell = traverseGraph(selectedcellData);
    if (resultCell.length === 1) {
      $('#filter-select-source-wrapper').css('display', 'none');
      let jsonData = null;
      jsonData = getJsonDataFromCell(resultCell[0]);
      console.log(jsonData);
      if (jsonData) {
        const filters = jsonToFilterArray(jsonData);
        $(document).ready(function () {
          if ($('#builder').data('queryBuilder')) {
            $('#builder').queryBuilder('destroy');
          }
          $('#builder').queryBuilder({
            filters
          });
          $('#btn-get-query').css('display', 'block');
          $('select[name^="builder_rule_"]').css('max-width', '250px');
          $('#btn-get-query').on('click', function () {
            var result = $('#builder').queryBuilder('getRules');
            if (!$.isEmptyObject(result)) {
              $('#output').css('display', 'block');
              $('.copy-btn').css('display', 'block');
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
    else {
      let jsonData = null;
      let allSourceDataJSON = [];
      for (var i = 0; i < resultCell.length; i++) {
        jsonData = getJsonDataFromCell(resultCell[i]);
        console.log(jsonData);
        if (jsonData) {
          allSourceDataJSON.push(jsonData);
        }
      }
      if (allSourceDataJSON?.length) {
        $('#filter-select-source-wrapper').css('display', 'flex');
        const select = $('#select-source');
        select.empty();

          const defaultOption = document.createElement("option");
          defaultOption.value = "";
          defaultOption.text = "Select an option";
          defaultOption.disabled = true;
          defaultOption.selected = true;
          select.append(defaultOption);


        allSourceDataJSON.forEach(function (item) {
          const parentKey = Object.keys(item)[0];
          const value = JSON.stringify(item[parentKey]);

          const option = document.createElement("option");
          option.value = value;
          option.text = parentKey;

          select.append(option);
        });

        $('#select-source').on('change', function () {
          $('#output').css('display', 'none');
          $('.copy-btn').css('display', 'none');
          const selectedValue = $(this).val();
          console.log("Selected value:", selectedValue);
          if (selectedValue) {
            const filters = jsonToFilterArray(JSON.parse(selectedValue), true);
            console.log("=====filters", filters);
            $(document).ready(function () {
              if ($('#builder').data('queryBuilder')) {
                $('#builder').queryBuilder('destroy');
              }
              $('#builder').queryBuilder({
                filters
              });
              $('#btn-get-query').css('display', 'block');
              $('select[name^="builder_rule_"]').css('max-width', '250px');
              $('#btn-get-query').on('click', function () {
                var result = $('#builder').queryBuilder('getRules');
                if (!$.isEmptyObject(result)) {
                  $('#output').css('display', 'block');
                  $('.copy-btn').css('display', 'block');
                  $('#output').text(JSON.stringify(result, null, 2));
                } else {
                  $('#output').text('No query defined.');
                }
              });
            });
          }
        });
      }
      else {
        filtermodal.style.display = "none";
        alert("=======source data not found");
      }
    }
  }
  else {
    filtermodal.style.display = "none";
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

function jsonToFilterArray(json,isMultipleSourceData = false) {
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
              type: mapType(data[key])
          });
      }
  }

  return filters;
}

