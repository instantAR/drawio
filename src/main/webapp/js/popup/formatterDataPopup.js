var formattermodal = document.getElementById("formatterDataModal");
var formatValidateBtn = document.getElementById("formatValidateBtn");
var formatterCancelBtn = document.getElementById("formatterCancelBtn");
var selectedcellData = '';
var selectedSource = '';
var selectedWorkspace = [];

var queryBuilderArray = ["Round off",
  "Length",
  "Padding",
  "Trim",
  "Concat",
  "Substring",
  "Default",
  "Mask",
  "Case Conversion"
];

const operatorOptions = {
  "Padding": ["Left", "Right", "Both"],
  "Trim": ["Left", "Right", "Both"],
  "Concat": ["Left", "Right", "Both"],
  "Case Conversion": ["Upper", "Lower"],
  "Mask": ["First", "Last", "All"]
};

var span = document.getElementById("close-formatterModal");
var formatterOkBtn = document.getElementById("formatterOkBtn");

formatterOkBtn.onclick = function () {
  
  const queryRules = collectRuleData();
  console.log(queryRules);
  let selectedRuleData = {
    filterDataBuilderQuery: {...queryRules}, 
    selectedSource:{...JSON.parse(selectedSource)}
  }
  selectedcellData['selectedRuleData']=JSON.stringify({...selectedRuleData});
  clearListner();
  formattermodal.style.display = "none";
}

formatterCancelBtn.onclick = () => {
  closeformatterModal();
}

formatValidateBtn.onclick = async function () {
    var allFilterCells = allFilterConnectedCells(selectedcellData);
    var allConnectedCellRules = [];
    const queryRules = collectRuleData();
    console.log(queryRules);
    let selectedRuleData = {
      filterDataBuilderQuery: {...queryRules}, 
      selectedSource:{...JSON.parse(selectedSource)}
    }
    selectedcellData['selectedRuleData']=JSON.stringify({...selectedRuleData});
    if(allFilterCells?.length) {
      allFilterCells.forEach((filterCell) => {
        if(filterCell?.selectedRuleData) {
          console.log("======filterCell",filterCell);
          const queryData = JSON.parse(filterCell.selectedRuleData).filterDataBuilderQuery;
          if(queryData) {
            allConnectedCellRules.push(queryData);
          }
        }
      });
      selectedcellData['selectedRuleData']= null;
    }
    if (!selectedWorkspace.length) {
      alert("workspace data not found");
      return;
    }
    const isWorkSpaceContainNull = selectedWorkspace.some(value => value === null);
    if (isWorkSpaceContainNull) {
      alert("workspace data not found for all connected source");
      return;
    }
    const selectedWorkspaceString = JSON.stringify(selectedWorkspace[0]);
    const ruleData = allConnectedCellRules.reverse();
    console.log("=========ruleData",ruleData);
    const encodedData = ruleData.map(item => {
      console.log('item: ', item)
      const itemUtf8Bytes = new TextEncoder().encode(JSON.stringify(item));
      return btoa(String.fromCharCode(...itemUtf8Bytes));
    });


    const selectedWorkspaceUtf8Bytes = new TextEncoder().encode(selectedWorkspaceString);

    const selectedWorkspaceEncoded = btoa(String.fromCharCode(...selectedWorkspaceUtf8Bytes));
    const payload = {
      "base64": selectedWorkspaceEncoded,
      "rules": encodedData,
    };
    console.log("=========payload",payload);
    $('#formatter-loader').show();
    try {
      const response = await applyWorkflowRules(payload);
      $('#formatter-loader').hide();
      if(response) {
        $('#formatter-validateOutput').css('display', 'block');
        $('.formatter-validate-copy-btn').css('display', 'block');
        if(!!response.json){
          $('#formatter-validateOutput').text(JSON.stringify(JSON.parse(response.json), null, 2));
        }else{
          alert('No valid data found.')
        }
      }
    } catch (error) {
    $('#formatter-loader').hide();
    console.error('Error while applying workflow rules:', error);
  } 
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
  $('#formatter-validateOutput').css('display', 'none');
  $('.formatter-validate-copy-btn').css('display', 'none');
  if(selectedcellData?.edges?.length) {
    var resultCell = traverseGraph(selectedcellData);

    if(resultCell) {
      var visibleCheckbox = $('.flex-shrink-0:visible');
      visibleCheckbox.prop('checked', true);
      if (resultCell.length === 1) {
        $('#formatter-select-source-wrapper').css('display', 'none');
        $('#formatter-ignore-case-wrapper').css('display', 'flex');
        let cellAttributesData = null;
        cellAttributesData = getJsonDataFromCell(resultCell[0]);
        if (cellAttributesData?.jsonData) {
          selectedSource = JSON.stringify(Object.values(cellAttributesData.jsonData)[0]);
          selectedWorkspace[0] = cellAttributesData?.selectedworkSpaceData;
          const filters = formatterJsonToFilterArray(cellAttributesData.jsonData);
          $(document).ready(function () {
            function addFilterOptions(selectElement) {
              filters.forEach(filter => {
                const value = filter.id.split('.');
                const filterElement = $('<option></option>').text(filter.label).val(value[value.length - 1]);
                selectElement.append(filterElement);
              });
            }
            function addOperatorOptions(selectElement) {
              queryBuilderArray.forEach(operator => {
                const optionElement = $('<option></option>').text(operator).val(operator);
                selectElement.append(optionElement);
              });
            }

            function populateDropdownBasedOnOperator(dropdown, operator) {
              dropdown.empty();
              if (operatorOptions[operator]) {
                operatorOptions[operator].forEach(value => {
                  const optionElement = $('<option></option>').text(value).val(value);
                  dropdown.append(optionElement);
                });
                dropdown.closest('.rule-dropdown-container').show();
                dropdown.parent().siblings('.rule-value2-container').hide();
                dropdown.parent().siblings('.rule-value2-container input').val();
                if(operator == 'Case Conversion'){
                  dropdown.parent().siblings('.rule-value-container').hide();
                }
                else if(operator == 'Mask'){
                  dropdown.parent().siblings('.rule-value-container').show();
                  dropdown.parent().siblings('.rule-value2-container').hide();
                }
                else{
                  dropdown.parent().siblings('.rule-value-container').show();
                }
              } else if(operator == 'Default'){
                dropdown.parent().siblings('.rule-value2-container').hide();
                dropdown.parent().siblings('.rule-value-container').show();
                dropdown.closest('.rule-dropdown-container').hide();
              } else if(operator == 'Round off'){
                dropdown.parent().siblings('.rule-value2-container').hide();
                dropdown.parent().siblings('.rule-value2-container input').val();
                dropdown.closest('.rule-dropdown-container').hide();
                dropdown.parent().siblings('.rule-value-container').show();
              } else if(operator == 'Length'){
                dropdown.parent().siblings('.rule-value2-container').hide();
                dropdown.parent().siblings('.rule-value2-container input').val();
                dropdown.closest('.rule-dropdown-container').hide();
                dropdown.parent().siblings('.rule-value-container').show();
              } else if(operator == 'Substring'){
                dropdown.parent().siblings('.rule-value2-container').show();
                dropdown.parent().siblings('.rule-value-container').show();
                dropdown.closest('.rule-dropdown-container').hide();
              } else {
                dropdown.parent().siblings('.rule-value2-container').hide();
                dropdown.parent().siblings('.rule-value2-container input').val();
                dropdown.closest('.rule-dropdown-container').hide();
              }
            }

            function updateDeleteButtonVisibility() {
              const ruleContainers = $('.rules-group-container .formatter-rule-container');
              ruleContainers.each(function (index) {
                const removeBtn = $(this).find('.remove-rule-btn');
                if (index === 0) {
                  removeBtn.hide();
                } else {
                  removeBtn.show();
                }
              });
            }

            function addRuleRow(rule) {
              var newRule = $('#ruleTemplate').clone().removeAttr('id');
              console.log("=======newRule",newRule);
              newRule.find('select').val('');
              newRule.find('input').val('');

              $('.rules-group-container').append(newRule);

              newRule.find('.rule-filter-container select').each(function () {
                $(this).empty();
                addFilterOptions($(this), filters);
                $(this).val(rule.id);
              });

              newRule.find('.rule-operator-container select').each(function () {
                $(this).empty();
                addOperatorOptions($(this));
                $(this).val(rule.operator);
                const selectedOperator = rule.operator;
                const correspondingDropdown = $(this).closest('.rule-wrapper').find('.rule-dropdown-container select');
                $(this).closest('.rule-wrapper').find('.rule-value-container input').val('');
                correspondingDropdown.val('');
                $(this).closest('.rule-wrapper').find('.rule-value2-container input').val('');
                value = '';
                valuePlus = '';
                value2 = '';
                populateDropdownBasedOnOperator(correspondingDropdown, selectedOperator);
                if(rule.valuePlus){
                  correspondingDropdown.val(rule.valuePlus)
                }
              }).on('change', function () {
                const selectedOperator = $(this).val();
                const correspondingDropdown = $(this).closest('.rule-wrapper').find('.rule-dropdown-container select');
                populateDropdownBasedOnOperator(correspondingDropdown, selectedOperator);
              });
              newRule.find('.rule-dropdown-container select').each(function () {
              }).on('change', function () {
                const selectedDrpdown = $(this).val();
                const correspondingDropdown = $(this).closest('.rule-wrapper').find('.rule-value-container');
                const value2Dropdown = $(this).closest('.rule-wrapper').find('.rule-value2-container');
                if(selectedDrpdown === "All" && correspondingDropdown) {
                    correspondingDropdown.hide();
                    value2Dropdown.hide();
                } else if(selectedDrpdown === "First") {
                  correspondingDropdown.show();
                  value2Dropdown.hide();
                }
                else if(selectedDrpdown === "Last") {
                  correspondingDropdown.show();
                  value2Dropdown.hide();
                }
              });

              newRule.find('.rule-value-container input').val(rule.value);
              if(rule.value2){
                newRule.find('.rule-value2-container input').val(rule.value2);
              }
              updateDeleteButtonVisibility();
            }
            $('#addRuleBtn').on('click', function () {
              var newRule = $('#ruleTemplate').clone().removeAttr('id');
              newRule.find('select').val('');
              newRule.find('input').val('');

              $('.rules-group-container').append(newRule);

              newRule.find('.rule-filter-container select').each(function () {
                $(this).empty();
                addFilterOptions($(this), filters);
              });

              newRule.find('.rule-operator-container select').each(function () {
                $(this).empty();
                addOperatorOptions($(this));
              }).on('change', function () {
                const selectedOperator = $(this).val();
                const correspondingDropdown = $(this).closest('.rule-wrapper').find('.rule-dropdown-container select');
                populateDropdownBasedOnOperator(correspondingDropdown, selectedOperator);
                $(this).closest('.rule-wrapper').find('.rule-value-container input').val('');
                correspondingDropdown.val('');
                $(this).closest('.rule-wrapper').find('.rule-value2-container input').val('');
                
                value = '';
                valuePlus = '';
                value2 = '';
              });

              newRule.find('.rule-dropdown-container select').each(function () {
              }).on('change', function () {
                const selectedDrpdown = $(this).val();
                const correspondingDropdown = $(this).closest('.rule-wrapper').find('.rule-value-container');
                const value2Dropdown = $(this).closest('.rule-wrapper').find('.rule-value2-container');
                if(selectedDrpdown === "All" && correspondingDropdown) {
                    correspondingDropdown.hide();
                    value2Dropdown.hide();
                } else if(selectedDrpdown === "First") {
                  correspondingDropdown.show();
                  value2Dropdown.hide();
                }
                else if(selectedDrpdown === "Last") {
                  correspondingDropdown.show();
                  value2Dropdown.hide();
                }
              });

              newRule.find('.rule-dropdown-container').hide();
              newRule.find('.rule-value2-container').hide();
              newRule.find('.rule-value-container').show();
              updateDeleteButtonVisibility();
            });

            $('.rules-group-container').on('click', '.remove-rule-btn', function () {
              $(this).closest('.formatter-rule-container').remove();
              updateDeleteButtonVisibility();
            });

            $('#ruleTemplate .rule-filter-container select').each(function () {
              $(this).empty();
              addFilterOptions($(this), filters);
            });
            $('#ruleTemplate .rule-operator-container select').each(function () {
              $(this).empty();
              addOperatorOptions($(this));
              const selectedOperator = $(this).val();
              if(selectedOperator === 'Round off') {
                const correspondingDropdown = $(this).closest('.rule-wrapper').find('.rule-dropdown-container select');
                correspondingDropdown.parent().siblings('.rule-value2-container').hide();
                correspondingDropdown.parent().siblings('.rule-value2-container input').val();
                correspondingDropdown.closest('.rule-dropdown-container').hide();
                correspondingDropdown.parent().siblings('.rule-value-container').show();
              }
            }).on('change', function () {
              const selectedOperator = $(this).val();
              const correspondingDropdown = $(this).closest('.rule-wrapper').find('.rule-dropdown-container select');
              $(this).closest('.rule-wrapper').find('.rule-value-container input').val('');
              correspondingDropdown.val('');
              $(this).closest('.rule-wrapper').find('.rule-value2-container input').val('');
              
              value = '';
              valuePlus = '';
              value2 = '';
              populateDropdownBasedOnOperator(correspondingDropdown, selectedOperator);
            });
            updateDeleteButtonVisibility();

            if(selectedcellData?.selectedRuleData) {
              const selectedSourceFromCellNew = Object.values(JSON.parse(selectedcellData.selectedRuleData).selectedSource);
              if(selectedcellData?.selectedRuleData && JSON.parse(selectedcellData.selectedRuleData).filterDataBuilderQuery){
                const existingRules = JSON.parse(selectedcellData.selectedRuleData).filterDataBuilderQuery;
                existingRules.rules.forEach(ruleData => {
                  if (ruleData.operator === 'Mask') {
                    [ruleData.valuePlus, ruleData.value] = [ruleData.value, ruleData.valuePlus];
                  }
                  if (ruleData.operator === "RoundOff") {
                    ruleData.operator = 'Round off';
                  }
                  if (ruleData.operator === "CaseConversion") {
                    ruleData.operator = 'Case Conversion';
                  }
                  if (ruleData.operator === "Substring") {
                    ruleData.value2 = ruleData.valuePlus;
                  }
                });
                $('.rules-group-container .formatter-rule-container').each(function() {
                  if (!$(this).attr('id')) {
                      $(this).remove();
                  }
                });
                existingRules.rules.forEach(rule => addRuleRow(rule));
                $('#ruleTemplate').remove();
                $('.rules-group-header').siblings('.formatter-rule-container').first().attr('id','ruleTemplate');
                updateDeleteButtonVisibility();
              }
            }
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
            selectedWorkspace.push(cellAttributesData.selectedworkSpaceData);
          }
        }
        if(allSourceDataJSON?.length) {
          $('#formatter-select-source-wrapper').css('display', 'flex');
          $('#formatter-ignore-case-wrapper').css('display', 'none');
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
              selectedSource = selectedValue;
              if (selectedValue) {
                const filters = formatterJsonToFilterArray(JSON.parse(selectedValue),true);
                $(document).ready(function () {
                  //TODO: for multiple block
                });
                /* const selectedSourceNew = JSON.parse(selectedSource);
                if(selectedcellData?.selectedRuleData) {
                  const selectedSourceFromCellNew = Object.values(JSON.parse(selectedcellData.selectedRuleData).selectedSource);
                  if(selectedcellData?.selectedRuleData && deepEqual(selectedSourceNew, selectedSourceFromCellNew) && JSON.parse(selectedcellData.selectedRuleData).filterDataBuilderQuery){
                    const existingRules = JSON.parse(selectedcellData.selectedRuleData).filterDataBuilderQuery;
                    $('.rules-group-container .formatter-rule-container').each(function() {
                      if (!$(this).attr('id')) {
                          $(this).remove();
                      }
                    });
                    existingRules.rules.forEach(rule => addRuleRow(rule));
                    $('#ruleTemplate').remove();
                    $('.rules-group-header').siblings('.formatter-rule-container').first().attr('id','ruleTemplate');
                  }
                } */
              }
          });

          if(selectedcellData?.selectedRuleData && JSON.parse(selectedcellData.selectedRuleData).selectedSource){
            const selectedValue = JSON.parse(selectedcellData.selectedRuleData).selectedSource;
            select.val(JSON.stringify(Object.values(selectedValue))).trigger('change');
          }
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


function resetValues() {
  var newRule = $('#ruleTemplate');
  newRule.find('.rule-value2-container input').val('');
  newRule.find('.rule-value-container input').val('');
  newRule.find('.rule-dropdown-container select').val('');
  newRule.find('.rule-dropdown-container').hide();
  newRule.find('.rule-value2-container').hide();
  $('.formatter-rule-container').slice(1).each(function () {
    $(this).remove();    
});

}
function collectRuleData() {
  const rules = [];

  $('.formatter-rule-container').each(function () {
      const id = $(this).find('.rule-filter-container select').val();
      const field = $(this).find('.rule-filter-container select option:selected').text();
      const operator = $(this).find('.rule-operator-container select').val();
      let value = $(this).find('.rule-value-container input').val();
      const valuePlusDropdown = $(this).find('.rule-dropdown-container select');
      let valuePlus = valuePlusDropdown.val() || valuePlusDropdown.find('option:selected').val();
      let value2 = $(this).find('.rule-value2-container input').val();
      const rule = {
          id: id,
          field: id,
          type: 'string',
          input: 'text',
          operator: operator,
          value: value
      };
      if(operator === "Round off") {
        rule.operator = "RoundOff";
      }
      if(operator === "Substring") {
        valuePlus = value2;
        value2 = "";
      }
      if(operator === "Case Conversion") {
        value = valuePlus;
        rule.value = value;
        valuePlus = "";
        value2 = "";
        rule.operator = "CaseConversion";
      }
     
      if (valuePlus) {
          rule.valuePlus = valuePlus;
      }

      if(operator === "Mask") {
        rule.value = valuePlus;
        rule.valuePlus = value;
        value2 = "";
      }

      if (value2) {
          rule.value2 = value2;
      }

      rules.push(rule);
  });

  var visibleCheckbox = $('.flex-shrink-0:visible');
  var isIgnoreCaseChecked = visibleCheckbox.is(':checked');

  return {
      type: 'Format',
      ignoreCase: isIgnoreCaseChecked,
      rules: rules
  };
}

function closeformatterModal() {
  formattermodal.style.display = "none";
  clearListner();
}

function clearListner() {
  $('#addRuleBtn').off('click');
  $('.rules-group-container').off('click', '.remove-rule-btn');
  $('#ruleTemplate .rule-operator-container select').off('change');
  getQueryRulesData = null;
  selectedWorkspace = [];
  selectedcellData = '';
  selectedSource = '';
  resetValues();
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

function allFilterConnectedCells(cell, filterDataCells = [], visited = new Set()) {
  var model = window.editorUiObj.editor.graph.getModel();

  if (!visited.has(cell)) {
    visited.add(cell);
    if (cell.style.includes('data_filter') || cell.style.includes('data_formatter')) {
      filterDataCells.push(cell);
    }

    if (cell.edges?.length) {

      for (var i = 0; i < cell.edges.length; i++) {
        var edge = cell.edges[i];
        var connectedCellIncoming = model.getTerminal(edge, true);
        if (connectedCellIncoming && !visited.has(connectedCellIncoming)) {
          allFilterConnectedCells(connectedCellIncoming, filterDataCells, visited);
        }
      }
    }
  }
  return filterDataCells;
}

function setAddDeleteRuleOrGroupFormatter() {
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
      ele.style.display = 'none';
    });
  }
  if(deleteBtn) {
    deleteBtn.forEach((ele) => {
      ele.innerHTML = `<i class="fa fa-trash">`;
    });
  }
}

