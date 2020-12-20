browser.runtime.onMessage.addListener(request => {
  var response = '';
  if(request.req === 'source-code') {
    response = document.documentElement.innerHTML;
  }
 
  return Promise.resolve({content: response});
});
