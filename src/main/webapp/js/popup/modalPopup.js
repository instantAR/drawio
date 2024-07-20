var modal = document.getElementById("myModal");
var selectedcellData = '';
let columnJsonData;
var span = document.getElementsByClassName("close")[0];
var jsonTextArea = document.getElementById("json-text-area");
var csvTextArea = document.getElementById("csv-text-area");
var okBtn = document.getElementById("okBtn");
var CurrentlyActivebtn = '';

function setCellAttributeData(updatedData) {
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
  var names = ['jsonData', 'selectedworkSpaceData'];
  if (updatedData) {
    for (var i = 0; i < names.length; i++) {
      if (names[i] === 'jsonData') {
        value.setAttribute(names[i], JSON.stringify(updatedData));
      } 
      if (CurrentlyActivebtn === '.btn-api' && names[i] === 'selectedworkSpaceData') {
        value.setAttribute(names[i], JSON.stringify(window.selectedworkSpaceData));
      }
      else {
        if (names[i] === 'selectedworkSpaceData' && value.hasAttribute(names[i])) {
          value.removeAttribute(names[i]);
        }
      }
      removeLabel = removeLabel || (names[i] === 'placeholder' &&
        value.getAttribute('placeholders') === '1');
    }
  }

  graph.getModel().setValue(selectedcellData, value);
  const popupData = {
    CurrentlyActivebtn,
    data: JSON.stringify(updatedData),
    parentNode:window.jsTreeDropdownParentData?window.jsTreeDropdownParentData:null
  }
  selectedcellData['selectedSourceData'] = JSON.stringify(popupData);
  jsonTextArea.value = '';
  csvTextArea.value = '';
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
  $('.btn-group .btn').removeClass("active");
  $('#nextBtn').show();
  $('#btn-wrapper').hide();
  $('#jstree-loader').show();
  $('#jsTree-wrapper').show();
  $('.header-data-wrapper, .json-data-textarea-wrapper').hide();
  $('#from-api-path').hide()
  localStorage.removeItem('jstree');
  callJsTreeAPI();
  if(selectedcellData?.selectedSourceData){
    if(JSON.parse(selectedcellData.selectedSourceData).CurrentlyActivebtn){
      const buttonData = JSON.parse(selectedcellData.selectedSourceData).CurrentlyActivebtn;
      const tabData = JSON.parse(selectedcellData.selectedSourceData).data;
      $(buttonData).addClass('active');
      $(buttonData).click();
      if (buttonData === '.btn-json') {
        const fromJsonData = JSON.parse(tabData)['From JSON'];
        jsonTextArea.value = JSON.stringify(fromJsonData, null, 2);
      } else if (buttonData === '.btn-csv') {
        const fromCsvData = JSON.parse(tabData)['From Comma Separated'];
        const updatedData = Object.keys(fromCsvData).join(',');
        csvTextArea.value = updatedData;
      } else{
        if(JSON.parse(selectedcellData.selectedSourceData).parentNode){
          let parentNodes = JSON.parse(selectedcellData.selectedSourceData).parentNode;
          parentNodes = parentNodes.filter(n => n);
          $('#from-api-path').text(parentNodes.join(' > '));
          $('#from-api-path').show();
          var activeButton = $('.btn-group .btn.active');
          if (activeButton.hasClass('btn-api')) {
            const selectedJsTreeData = selectedcellData.selectedJsTreeData;
            window.jsTreeDropdownData = selectedJsTreeData;
            if(selectedJsTreeData) {
              var tbody = $('.table tbody');
              $('.table tbody').empty();
              $('#jsTree-wrapper').hide();
              $('.json-data-textarea-wrapper').hide();
              $('.header-data-wrapper').show();
              $('#nextBtn').hide(); 
              $('#btn-wrapper').show();
              try {
                columnJsonData = JSON.parse(selectedJsTreeData);
              } catch (e) {
                columnJsonData = {'From JsTree' : { [selectedJsTreeData] : 'string'}};
              }
              Object.keys(columnJsonData[Object.keys(columnJsonData)[0]]).forEach(function(key) {
                var tr = $('<tr class="border border-bottom"></tr>');
                var tdName = $('<td><div class="column-name"><input type="text" name="cname" id="cname" class="form-control" value="' + key + '"></div></td>');
                var tdIsVisible = $('<td><input type="checkbox" name="columnCheck" class="form-check-input" checked></td>');
                var tdRename = $('<td><div class="column-name"><input type="text" name="rename" class="form-control"></div></td>');
            
                tr.append(tdName, tdIsVisible, tdRename);
            
                tbody.append(tr);
              });
              addNewRow();
              $(document).on('input', 'input[name="cname"]', function() {
                if ($('.table tbody tr:last-child input[name="cname"]').val() !== '') {
                  addNewRow();
                }
              });
            }
          }
        }
      }
    }
  }
  else {
    $('.btn-api').addClass('active');
  }
}

function closeModal() {
  jsonTextArea.value = '';
  csvTextArea.value = '';
  modal.style.display = "none";
}


function triggerModalFromJs(cellData) {
  selectedcellData = cellData;
  openModal();
}

function addNewRow() {
  var tbody = $('.table tbody');
  var tr = $('<tr class="border border-bottom"></tr>');
  var tdName = $('<td><div class="column-name"><input type="text" name="cname" id="cname" class="form-control"></div></td>');
  var tdIsVisible = $('<td><input type="checkbox" name="columnCheck" class="form-check-input" checked></td>');
  var tdRename = $('<td><div class="column-name"><input type="text" name="rename" class="form-control"></div></td>');

  tr.append(tdName, tdIsVisible, tdRename);

  tbody.append(tr);
}

$(document).ready(function() {
  function handleButtonClick(buttonClass, showJsTree, showTextarea) {
    CurrentlyActivebtn = buttonClass;
    $('.btn-group .btn').removeClass("active");
    $(buttonClass).addClass('active');
    $('#nextBtn').show();
    $('#btn-wrapper').hide();
    $('.header-data-wrapper, .json-data-textarea-wrapper').hide();
    if (showJsTree) {
      $('#jstree-loader').show();
      $('#jsTree-wrapper').show();
      callJsTreeAPI();
    } else {
      $('#jsTree-wrapper').hide();
    }

    if (showTextarea) {
      $('.json-data-textarea-wrapper').show();
    } else {
      $('.json-data-textarea-wrapper').hide();
    }
  }


  function getUpdatedJsonData() {
    var mainKey = Object.keys(columnJsonData)[0];
    // Iterate over the table rows
    const newData = [];
    $('.table tbody tr').each(function() {
      var checkbox = $(this).find('input[name="columnCheck"]');
      var columnNameInput = $(this).find('input[name="cname"]');
      var renameInput = $(this).find('input[name="rename"]');
      var columnName = columnNameInput.val();
      var isChecked = checkbox.is(':checked');
      var rename = renameInput.val();
      const trimmedRename = rename ? rename.trim() : ''; 
      if (isChecked && columnName) {
          const value = trimmedRename || columnName;
          newData.push({ id: columnName, value, type: columnJsonData[mainKey][columnName] || 'string' });
      }
    });
    const data = { [mainKey] : newData};
    return data;
  }

  function initializeModal() {
    handleButtonClick('.btn-api', true, false); // Default to API tab
    $('#nextBtn').show();
    $('#btn-wrapper').hide();
    $('.header-data-wrapper').hide();
  }

    initializeModal();

  $('.btn-json').on('click', function() {
    $('#csv-text-area').css('display', 'none');
    $('#json-text-area').css('display', 'flex');

    handleButtonClick('.btn-json', false, true);
  });

  $('.btn-api').on('click', function() {
    handleButtonClick('.btn-api', true, false);
  });

  $('.btn-csv').on('click', function() {
    $('#json-text-area').css('display', 'none');
    $('#csv-text-area').css('display', 'flex');

    handleButtonClick('.btn-csv', false, true);
  });

  $('#nextBtn').on('click', function () {
    var activeButton = $('.btn-group .btn.active');

    // Perform actions based on the active button
    if (activeButton.hasClass('btn-json')) {
      // Actions for JSON
      if(jsonTextArea.value) {
        const isValid = isValidJSON(jsonTextArea.value);
        if(isValid) {
          const textAreaJsonData = JSON.parse(jsonTextArea.value);
          const data = getKeyWithDataType(textAreaJsonData);
            var tbody = $('.table tbody');
            $('.table tbody').empty();

            $('#jsTree-wrapper').hide();
            $('.json-data-textarea-wrapper').hide();
            $('.header-data-wrapper').show();
            $('#nextBtn').hide();
            $('#btn-wrapper').show();
            columnJsonData = {'From JSON' : data};
           
            Object.keys(columnJsonData[Object.keys(columnJsonData)[0]]).forEach(function (key) {
              var tr = $('<tr class="border border-bottom"></tr>');
              var tdName = $('<td><div class="column-name"><input type="text" name="cname" id="cname" class="form-control" value="' + key + '"></div></td>');
              var tdIsVisible = $('<td><input type="checkbox" name="columnCheck" class="form-check-input" checked></td>');
              var tdRename = $('<td><div class="column-name"><input type="text" name="rename" class="form-control"></div></td>');

              tr.append(tdName, tdIsVisible, tdRename);

              tbody.append(tr);
            });

            addNewRow();

            $(document).on('input', 'input[name="cname"]', function () {
              if ($('.table tbody tr:last-child input[name="cname"]').val() !== '') {
                addNewRow();
              }
            });
        }
        else {
          alert("enter valid json")
        }
      }
    } else if (activeButton.hasClass('btn-api')) {
      if(window.jsTreeDropdownData) {
        var tbody = $('.table tbody');
        $('.table tbody').empty();
      
        $('#jsTree-wrapper').hide();
        $('.json-data-textarea-wrapper').hide();
        $('.header-data-wrapper').show();
        $('#nextBtn').hide(); 
        $('#btn-wrapper').show();
        try {
          columnJsonData = JSON.parse(window.jsTreeDropdownData);
        } catch (e) {
          columnJsonData = {'From JsTree' : { [window.jsTreeDropdownData] : 'string'}};
        }

        Object.keys(columnJsonData[Object.keys(columnJsonData)[0]]).forEach(function(key) {
          var tr = $('<tr class="border border-bottom"></tr>');
          var tdName = $('<td><div class="column-name"><input type="text" name="cname" id="cname" class="form-control" value="' + key + '"></div></td>');
          var tdIsVisible = $('<td><input type="checkbox" name="columnCheck" class="form-check-input" checked></td>');
          var tdRename = $('<td><div class="column-name"><input type="text" name="rename" class="form-control"></div></td>');
      
          tr.append(tdName, tdIsVisible, tdRename);
      
          tbody.append(tr);
        });

        addNewRow();

        $(document).on('input', 'input[name="cname"]', function() {
          if ($('.table tbody tr:last-child input[name="cname"]').val() !== '') {
            addNewRow();
          }
        });
      }
      else {
        alert("no data selected")
      }
    } else if (activeButton.hasClass('btn-csv')) {
      if(csvTextArea.value) {
        const isValid = isCommaSeparated(csvTextArea.value);
        if(isValid) {
          const csvTextareadata = csvTextArea.value.split(',');

          var tbody = $('.table tbody');
          $('.table tbody').empty();

          $('#jsTree-wrapper').hide();
          $('.json-data-textarea-wrapper').hide();
          $('.header-data-wrapper').show();
          $('#nextBtn').hide();
          $('#btn-wrapper').show();
          columnJsonData = {};
          csvTextareadata.forEach(function (key) {
            columnJsonData[key] = 'string';
          });
          columnJsonData = {'From Comma Separated' : columnJsonData};

          Object.keys(columnJsonData[Object.keys(columnJsonData)[0]]).forEach(function(key) {
            var tr = $('<tr class="border border-bottom"></tr>');
            var tdName = $('<td><div class="column-name"><input type="text" name="cname" id="cname" class="form-control" value="' + key + '"></div></td>');
            var tdIsVisible = $('<td><input type="checkbox" name="columnCheck" class="form-check-input" checked></td>');
            var tdRename = $('<td><div class="column-name"><input type="text" name="rename" class="form-control"></div></td>');

            tr.append(tdName, tdIsVisible, tdRename);

            tbody.append(tr);
          });

          addNewRow();

          $(document).on('input', 'input[name="cname"]', function () {
            if ($('.table tbody tr:last-child input[name="cname"]').val() !== '') {
              addNewRow();
            }
          });
        }
        else {
          alert("enter valid csv")
        }
      }
    }
  });

  $('#okBtn').on('click', async function () {
    var updatedData = getUpdatedJsonData();
    const collectionId = selectedcellData['collectionId'];
      const response = await fetch(`${window.enviroment.restBackendService}api/get_api_by_id/${collectionId}`);
      const workspace = await response.json();
  
      if (workspace) {
        const workspaceData = workspace.api;
        window.selectedworkSpaceData = workspaceData;
      }

    setCellAttributeData(updatedData);

    selectedcellData['selectedJsTreeData']= window.jsTreeDropdownData;
    window.jsTreeDropdownData = null;
  });

  $('#backBtn').on('click', function () { 
    var activeButton = $('.btn-group .btn.active');
    if (activeButton.hasClass('btn-json')) {
      $('#jsTree-wrapper').hide();
      $('.json-data-textarea-wrapper').show();
      $('.header-data-wrapper').hide();
      $('#nextBtn').show();
      $('#btn-wrapper').hide();
    } else if (activeButton.hasClass('btn-api')) {
      $('#jsTree-wrapper').show();
      $('.json-data-textarea-wrapper').hide();
      $('.header-data-wrapper').hide();
      $('#nextBtn').show(); 
      $('#btn-wrapper').hide();

    } else if (activeButton.hasClass('btn-csv')) {
      $('#jsTree-wrapper').hide();
      $('.json-data-textarea-wrapper').show();
      $('.header-data-wrapper').hide();
      $('#nextBtn').show();
      $('#btn-wrapper').hide();
    }
  });

  $(document).ready(function() {
    function copyTextFromElement(selector) {
        var textToCopy = $(selector).text();

        var tempTextArea = document.createElement('textarea');
        tempTextArea.value = textToCopy;
        document.body.appendChild(tempTextArea);

        tempTextArea.select();
        tempTextArea.setSelectionRange(0, 99999); // For mobile devices

        document.execCommand('copy');
        document.body.removeChild(tempTextArea);
    }
    $(document).on('click', '.copy-btn, .validate-copy-btn, .formatter-validate-copy-btn', function() {
        var idMap = {
            'copy-btn': '#output',
            'validate-copy-btn': '#validateOutput',
            'formatter-validate-copy-btn': '#formatter-validateOutput'
        };

        var selector = idMap[$(this).attr('class').split(' ').find(cls => idMap[cls])];
        if (selector) {
            copyTextFromElement(selector);
        }
    });
  })
});

function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

function isCommaSeparated(str) {
  const parts = str.split(',');
  return parts.length > 1;
}

function getKeyWithDataType(obj){
  const result = {};
  function traverseObj(obj, prefix = '') {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const valueType = typeof value;

        if (valueType === 'object' && value !== null && !Array.isArray(value)) {
          traverseObj(value, fullKey);
        }
        else if (Array.isArray(value) && typeof value[0] === 'object') {
          traverseObj(value[0], fullKey);
        }
        else {
          result[fullKey] = valueType === 'object' && value === null ? 'string' : valueType;
        }
      }
    }
  }
  traverseObj(obj);
  return result;
}

function headerTableCreate(data) {
  if(data) {
    var tbody = $('.table tbody');
    $('.table tbody').empty();
  
    $('#jsTree-wrapper').hide();
    $('.json-data-textarea-wrapper').hide();
    $('.header-data-wrapper').show();
    $('#nextBtn').hide(); 
    $('#btn-wrapper').show();
    try {
      columnJsonData = JSON.parse(data);
    } catch (e) {
      columnJsonData = {'New' : { [data] : 'string'}};
    }

    Object.keys(columnJsonData[Object.keys(columnJsonData)[0]]).forEach(function(key) {
      var tr = $('<tr class="border border-bottom"></tr>');
      var tdName = $('<td><div class="column-name"><input type="text" name="cname" id="cname" class="form-control" value="' + key + '"></div></td>');
      var tdIsVisible = $('<td><input type="checkbox" name="columnCheck" class="form-check-input" checked></td>');
      var tdRename = $('<td><div class="column-name"><input type="text" name="rename" class="form-control"></div></td>');
  
      tr.append(tdName, tdIsVisible, tdRename);
  
      tbody.append(tr);
    });

    addNewRow();

    $(document).on('input', 'input[name="cname"]', function() {
      if ($('.table tbody tr:last-child input[name="cname"]').val() !== '') {
        addNewRow();
      }
    });
  }
  else {
    alert("no data selected")
  }
}