(()=>{const e=e=>{(e=>{const t=e.keyCode;return(t>=48&&t<=57||t>=96&&t<=105)&&!e.shiftKey})(e)||(e=>{const t=e.keyCode;return 35===t||36===t||8===t||9===t||13===t||46===t||t>36&&t<41||(!0===e.ctrlKey||!0===e.metaKey)&&(65===t||67===t||86===t||88===t||90===t)})(e)||e.preventDefault()},t=e=>{const t=e.target,n=e.target.value.replace(/\D/g,"").substring(0,10),r=n.substring(0,3),s=n.substring(3,6),u=n.substring(6,10);n.length>6?t.value=`(${r}) ${s}-${u}`:n.length>3?t.value=`(${r}) ${s}`:n.length>0&&(t.value=`(${r}`)};document.querySelectorAll('input[type="tel"]').forEach((n=>{n.addEventListener("keydown",e),n.addEventListener("keyup",t)}))})();