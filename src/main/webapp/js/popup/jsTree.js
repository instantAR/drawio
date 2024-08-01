export function callAPI(){
  
const queryString = window.location.search.substring(1);
const params = new URLSearchParams(queryString);
let workspaceIdURL = params ? params.get('workspaceId') : null;

fetch(`${window.enviroment.restBackendService}app/workspaces/${workspaceIdURL}/collections`)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(apiData => {
      const apiCollectionData = apiData;
      const data = generateTree(apiCollectionData);
      let iscreated = {};
      if ($('#jstree').jstree(true)) {
        $('#jstree').jstree('destroy').empty();
    }
    localStorage.removeItem('jstree');
      $('#jstree')
        .jstree({
          'core': {
            'check_callback': true,
            'data': data,
            'themes': { dots: false }
          },
          'types': {
            'GET': { 'icon': 'get-api' },
            'POST': { 'icon': 'post-api' },
            'PATCH': { 'icon': 'patch-api' },
            'PUT': { 'icon': 'put-api' },
            'DELETE': { 'icon': 'delete-api' },
            'OPTIONS': { 'icon': 'options-api' },
            'HEAD': { 'icon': 'head-api' },
            'folder': { 'icon': 'fa-solid fa-folder-open main-color' },
            "default": {
              "icon": "fa-solid fa-cube main-color"
            },
            "arrayList": {
              "icon": "fa-solid fa-table main-color"
            },
            "stringList": {
              "icon": "fa-solid fa-list main-color"
            },
            "object": {
              "icon": "fa-solid fa-brackets-curly main-color"
            },
            "string": {
              "icon": "fa-solid fa-quote-left main-color"
            },
            "number": {
              "icon": "fa-solid fa-hashtag main-color"
            },
            "none": {
              "icon": "fa-solid fa-ban main-color"
            },
            "boolean": {
              "icon": "fa-solid fa-check main-color"
            },
          },
          'search': {
            'case_insensitive': true,
            'show_only_matches': true
          },
          "plugins": ["search", "state", "types", "dnd", "contextmenu"]
        });
      $('#jstree').on('select_node.jstree', (e, data) => {
        var path = getPath(data.node);
        window.jsTreeDropdownParentData = path;
        const nodeId = data.node.id;
        if (nodeId != '#' && ['GET', 'POST', 'PATCH', 'PUT'].includes(data.node.type)) {
          iscreated[nodeId] = true;
          $('#' + nodeId).addClass("jstree-loading").attr('aria-busy', true);
          switchToAjaxLoading(data);
        }
        else {
          const selectedCollection = data.node;
          if (selectedCollection.type === "arrayList") {
            const dropKeyData = selectedCollection.original.proxyData;
            const dropKeyPath = selectedCollection.original.text;
            // const workspaceName = "workspace";
            // const modifiedDropKeyPath = dropKeyPath.replace(/^k\./, `${workspaceName}.`);
            const keyDataTypes = getKeyWithDataType(dropKeyData[0]);

            const mainDropObj = { [dropKeyPath]: keyDataTypes };
            window.jsTreeDropdownData = JSON.stringify(mainDropObj);
          }
          else if (selectedCollection.type === "object") {
            const dropKeyData = selectedCollection.original.proxyData;
            const dropKeyPath = selectedCollection.original.text;
            const keyDataTypes = getKeyWithDataType(dropKeyData);

            const mainDropObj = { [dropKeyPath]: keyDataTypes };
            window.jsTreeDropdownData = JSON.stringify(mainDropObj);
          }
          else {
            window.jsTreeDropdownData = selectedCollection.original.text;
          }
        }
      });
      $('#deliverable_search').keyup(function(){
        $('#jstree').jstree(true).show_all();
        $('#jstree').jstree('search', $(this).val());
    });
      $('#jstree-loader').hide();
  })
  .catch(error => {
    // console.error("Error during fetch:", error);
  });
}
function getPath(node) {
  var path = [];
  while (node) {
      path.unshift(node.text);
      node = $('#jstree').jstree('get_node', node.parent);
  }
  return path;
}
function generateTree(apiCollectionData) {
  const outputArray = apiTree(apiCollectionData);
  return outputArray;
}

function apiTree(apiCollectionData, parentId = null, path = []) {
  const data = [];

  apiCollectionData.forEach((item) => {
    if (item.parentId === parentId) {
      const newNode = {
        text: item.name,
        type: item.method || 'folder',
        _id: item._id,
        id: 'API_' + item._id,
        url: item.url,
        headers: item.headers,
        authentication: item.authentication,
        path: [...path, item.name],
        children: apiTree(apiCollectionData, item._id, [...path, item.name])
      };
      data.push(newNode);
    }
  });

  return data;
};


async function switchToAjaxLoading(selectedNode = null) {
  if (!selectedNode) return;
  const nodeId = selectedNode.node.id;
  const proxyRequestUrl = selectedNode.node.original.url;
  let updatedProxyReqUrl;

  if (!proxyRequestUrl && selectedNode.node.original.type === "GET") {
    handleErrorMessage(nodeId, 'GET API URL not found');
    return;
  }

  const collectionId = selectedNode.node.original._id;
  selectedcellData['collectionId'] = collectionId;
  try {
    const response = await fetch(`${window.enviroment.restBackendService}api/get_api_by_id/${collectionId}`);
    const workspace = await response.json();

    if (workspace) {
      const workspaceData = workspace.api;
      window.selectedworkSpaceData = workspaceData;
      const apiRequest = selectedNode.node.original;

      if (apiRequest.type !== 'GET') {
        let jsonData = {};
        const MIMETYPE = workspaceData.body.mimeType;

        if (MIMETYPE === 'application/json' && workspaceData.body && workspaceData.body.text) {
          try {
            const dataArray = JSON.parse(workspaceData.body.text);
            jsonData = Array.isArray(dataArray) && dataArray.every(x => typeof x === 'object') ? dataArray[0] : dataArray;
          } catch (err) {
            const dataArray = eval(workspaceData?.body?.text);
            jsonData = Array.isArray(dataArray) && dataArray.every(x => typeof x === 'object') ? dataArray[0] : dataArray;
          }
        } else if (MIMETYPE === 'multipart/form-data') {
          jsonData = workspaceData.body.params.reduce((obj, curr) => {
            if (!curr.disabled) {
              obj[curr.name] = curr.value;
            }
            return obj;
          }, {});
        } else if (MIMETYPE === 'application/x-www-form-urlencoded') {
          jsonData = workspaceData.body.params.filter(param => !param.disabled).reduce((obj, curr) => {
            obj[curr.name] = curr.value;
            return obj;
          }, {});
        }

        if (workspaceData.parameters?.length) {
          const queryparams = workspaceData.parameters.filter(param => !param.disabled).reduce((obj, curr) => {
            obj[curr.name] = curr.value;
            return obj;
          }, {});

          if (Object.keys(jsonData).length && Object.keys(queryparams).length) {
            jsonData = { 'body': jsonData, 'query': queryparams };
          }
        }

        if (Object.keys(jsonData).length) {
          const newNodeData = apiResponseToGenerateTree(jsonData);

          if (newNodeData?.length) {
            newNodeData.forEach(item => {
              $('#jstree').jstree(true).create_node(nodeId, item, 'last');
              $('#jstree').jstree(true).open_node(nodeId);
            });
            $('#' + nodeId).removeClass("jstree-loading").attr('aria-busy', false);
            return;
          } else {
            $('#' + nodeId).removeClass("jstree-loading").attr('aria-busy', false);
          }
        } else {
          $('#' + nodeId).removeClass("jstree-loading").attr('aria-busy', false);
          alert('No Data Found');
        }
        return;
      }

      if (workspaceData?.url) {
        const headers = {};
        if (workspaceData.headers?.length) {
          workspaceData.headers.forEach(header => {
            if (!header?.disabled && header.name && header.value) {
              headers[`X-Proxy-Req-Header-${header.name}`] = header.value;
            }
          });
        }

        if (workspaceData.parameters?.length) {
          const parsedUrl = new URL(workspaceData.url);
          const baseUrl = parsedUrl.origin + parsedUrl.pathname;
          const existingParams = parsedUrl.searchParams.toString();
          const params = new URLSearchParams(existingParams);

          workspaceData.parameters.forEach(param => {
            if (!params.has(param.name) && !param.disabled) {
              params.append(param.name, param.value);
            }
          });

          updatedProxyReqUrl = `${baseUrl}?${params.toString()}`;
        } else {
          updatedProxyReqUrl = workspaceData.url;
        }

        const authUserPass = workspaceData.authentication;
        if (!authUserPass?.disabled) {
          if (headers.hasOwnProperty('X-Proxy-Req-Header-Content-Type') && headers['X-Proxy-Req-Header-Content-Type'] !== 'application/json') {
            delete headers['X-Proxy-Req-Header-Content-Type'];
          }
          const type = authUserPass?.type?.charAt(0).toUpperCase() + authUserPass?.type?.slice(1);
          if (type) {
            if (authUserPass.type === 'No Auth' || authUserPass.type === 'bearer') {
              if (!headers.hasOwnProperty('X-Proxy-Req-Header-Authorization') && authUserPass.type !== 'No Auth') {
                headers['X-Proxy-Req-Header-Authorization'] = authUserPass.token ? `${type} ${authUserPass.token}` : `${type}`;
              }
            } else {
              if (!headers.hasOwnProperty('X-Proxy-Req-Header-Authorization')) {
                const data = `${authUserPass.username}:${authUserPass.password}`;
                const encodedUserNamePassword = btoa(data);
                headers['X-Proxy-Req-Header-Authorization'] = `${type} ${encodedUserNamePassword}`;
              }
            }
          }
        }

        const reqHeaders = {
          ...headers,
          'X-Proxy-Req-Method': 'GET',
          'X-Proxy-Req-Url': updatedProxyReqUrl,
        };

        if (apiRequest.type === 'GET') {
          const proxyResponse = await fetch(`${window.enviroment.restClientService}proxy`, {
            method: 'POST',
            headers: reqHeaders
          });

          const res = await proxyResponse.json();

          if (res && res.eventData?.buffer) {
            const supportedTypes = ['application/json', 'text/plain'];
            if (supportedTypes.some(type => res.eventData.mimeType.includes(type))) {
              const buffer = res.eventData.buffer;
              const uint8Array = new Uint8Array(buffer);
              const decoder = new TextDecoder('utf-8');
              const decodedString = decoder.decode(uint8Array);

              if (decodedString) {
                let jsonData;
                try {
                  jsonData = JSON.parse(decodedString);
                } catch (error) {
                  handleErrorMessage(nodeId, 'Text plain data not parse');
                }
                const newNodeData = apiResponseToGenerateTree(jsonData);

                if (newNodeData?.length) {
                  newNodeData.forEach(item => {
                    $('#jstree').jstree(true).create_node(nodeId, item, 'last');
                    $('#jstree').jstree(true).open_node(nodeId);
                  });
                  $('#' + nodeId).removeClass("jstree-loading").attr('aria-busy', false);
                  return;
                } else {
                  $('#' + nodeId).removeClass("jstree-loading").attr('aria-busy', false);
                }
              }
            } else {
              handleErrorMessage(nodeId, 'Unsupported Type');
            }
          } else {
            handleErrorMessage(nodeId, res.eventData);
          }
        }
      }
    }
  } catch (err) {
    alert('Something went wrong, please try again!');
  }
}

function handleErrorMessage(nodeId, message) {
  console.error(message);
  $('#' + nodeId).removeClass("jstree-loading").attr('aria-busy', false);
}

function apiResponseToGenerateTree(data) {
  function getData(data) {
    const out = [];
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string') {
        out.push({ text: k, type: 'string' });
      } else if (typeof v === 'number') {
        out.push({ text: k, type: 'number' });
      } else if (typeof v === 'boolean') {
        out.push({ text: k, type: 'boolean' });
      } else if (v === null) {
        out.push({ text: k, type: 'none' });
      } else if (Array.isArray(v)) {
        const isObjectArray = v.every(x => typeof x === 'object');
        const isStringArray = !isObjectArray && v.every(x => typeof x === 'string');
        const uniqueKeyValuePairs = getUniqueKeyValuePairs(v);
        const children = getData(uniqueKeyValuePairs);
        if (isObjectArray) {
          out.push({
            text: k,
            type: 'arrayList',
            children,
            proxyData: v,
          });
        } else if (isStringArray) {
          out.push({
            text: k,
            type: 'stringList',
            children,
          });
        }
      } else if (typeof v === 'object') {
        const children = getData(v);
        out.push({
          text: k,
          type: 'object',
          children,
          proxyData: v,
        });
      }
    }
    return out;
  }

  function addPath(d, path) {
    for (const i of d) {
      i.path = `${path}.${i.text}`;
      if ('children' in i) {
        addPath(i.children, i.path);
      }
    }
  }

  function getUniqueKeyValuePairs(dataArray) {
    const uniqueKeyValuePairs = {};
    const count = Math.min(10, dataArray.length);

    for (let i = 0; i < count; i++) {
      const record = dataArray[i];
      Object.entries(record).forEach(([key, value]) => {
        uniqueKeyValuePairs[key] = value;
      });
    }

    return uniqueKeyValuePairs;
  }

  const tree = getData(data);
  addPath(tree, 'k');
  return tree;
}

  function getKeyWithDataType(obj) {
    const result = {};
    function traverseObj(obj, prefix = '') {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          const fullKey = prefix ? `${prefix}.${key}` : key;
          const valueType = typeof value;
  
          if (valueType === 'object' && value !== null && !Array.isArray(value)) {
            traverseObj(value, fullKey);
          } else if (Array.isArray(value) && typeof value[0] === 'object') {
            traverseObj(value[0], fullKey);
          } else {
            result[fullKey] = valueType === 'object' && value === null ? 'string' : valueType;
          }
        }
      }
    }
    traverseObj(obj);
    return result;
  }
  
