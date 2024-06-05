var filtermodal = document.getElementById("filterDataModal");
var selectedcellData = '';
var selectedSource = '';
var span = document.getElementById("close-filterModal");
var filterOkBtn = document.getElementById("filterOkBtn");

filterOkBtn.onclick = function () {
    var result = $('#builder').queryBuilder('getRules');
    if (!$.isEmptyObject(result)) {
      let selectedFilterData = {
        filterDataBuilderQuery: {...result},
        selectedSource:{...JSON.parse(selectedSource)}
      }
      selectedcellData['selectedFilterData']=JSON.stringify({...selectedFilterData});
    }

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

    $('#btn-get-query').css('display', 'none');
    $('#output').css('display', 'none');
    $('.copy-btn').css('display', 'none');

  if ($('#builder').data('queryBuilder')) {
    $('#builder').queryBuilder('destroy');
  }

  if (selectedcellData?.edges?.length) {
    var resultCell = traverseGraph(selectedcellData);
    if(resultCell) {
      if (resultCell.length === 1) {
        $('#filter-select-source-wrapper').css('display', 'none');
        let jsonData = null;
        jsonData = getJsonDataFromCell(resultCell[0]);
        if (jsonData) {
          selectedSource = JSON.stringify(Object.values(jsonData)[0]);
          const filters = jsonToFilterArray(jsonData);
          $(document).ready(function () {

            if ($('#builder').data('queryBuilder')) {
              $('#builder').queryBuilder('destroy');
            }
            $('#builder').queryBuilder({
              filters
            });
            $('#btn-get-query').css('display', 'block');
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
            if(selectedcellData?.selectedFilterData && selectedSource==JSON.stringify(JSON.parse(selectedcellData.selectedFilterData).selectedSource)&&JSON.parse(selectedcellData.selectedFilterData).filterDataBuilderQuery){
              $('#builder').queryBuilder('setRules', JSON.parse(selectedcellData.selectedFilterData).filterDataBuilderQuery);
            }
            setAddDeleteRuleOrGroup();
            $('#builder').on('afterAddRule.queryBuilder', function(e, rule) {
              setAddDeleteRuleOrGroup();
            });
          });
        }
        else {
          filtermodal.style.display = "none";
          alert("source data not found");
        }
      }
      else {
        let jsonData = null;
        let allSourceDataJSON = [];
        for (var i = 0; i < resultCell.length; i++) {
          jsonData = getJsonDataFromCell(resultCell[i]);
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
            selectedSource = selectedValue;
            if (selectedValue) {
              const filters = jsonToFilterArray(JSON.parse(selectedValue), true);
              $(document).ready(function () {
                if ($('#builder').data('queryBuilder')) {
                  $('#builder').queryBuilder('destroy');
                }
                $('#builder').queryBuilder({
                  filters
                });
                $('#btn-get-query').css('display', 'block');
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
                if(selectedcellData?.selectedFilterData && selectedSource==JSON.stringify(JSON.parse(selectedcellData.selectedFilterData).selectedSource)&&JSON.parse(selectedcellData.selectedFilterData).filterDataBuilderQuery){
                  $('#builder').queryBuilder('setRules', JSON.parse(selectedcellData.selectedFilterData).filterDataBuilderQuery);
                }
                setAddDeleteRuleOrGroup();
                $('#builder').on('afterAddRule.queryBuilder', function(e, rule) {
                  setAddDeleteRuleOrGroup();
                });
              });
            }
          });
          if(selectedcellData?.selectedFilterData && JSON.parse(selectedcellData.selectedFilterData).selectedSource){
            const selectedValue = JSON.parse(selectedcellData.selectedFilterData).selectedSource;
            select.val(JSON.stringify(selectedValue)).trigger('change');
          }
        }
        else {
          filtermodal.style.display = "none";
          alert("source data not found");
        }
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

function setAddDeleteRuleOrGroup() {
  const addRuleBtn = document.querySelectorAll('.btn-xs.btn-success[data-add="rule"]');
  const addGroupBtn = document.querySelectorAll('.btn-xs.btn-success[data-add="group"]');
  const deleteBtn = document.querySelectorAll('.btn-xs.btn-danger[data-delete="rule"]');
  if (addRuleBtn) {
    addRuleBtn.forEach((ele) => {
      ele.innerHTML = `<i class="glyphicon glyphicon-plus"></i> Rule`;
    });
  }
  if (addGroupBtn) {
    addGroupBtn.forEach((ele) => {
      ele.innerHTML = `<i class="glyphicon glyphicon-plus-sign"></i> Group`;
    });
  }
  if(deleteBtn) {
    deleteBtn.forEach((ele) => {
      ele.innerHTML = `<i class="fa fa-trash">`;
    });
  }
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
          return 'string';
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

