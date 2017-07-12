const FileReceiver = require('./fileReceiver');
const { notify } = require('./utils');
const $ = require('jquery');

const Raven = window.Raven;

$(document).ready(function() {
  $('#download-progress').hide();
  $('#send-file').click(() => {
    window.location.replace(`${window.location.origin}`);
  });
  $('#download-btn').click(download);
  function download() {
    const fileReceiver = new FileReceiver();
    const name = document.createElement('p');
    const $btn = $('#download-btn');

    fileReceiver.on('progress', percentComplete => {
      $('#download-page-one').hide();
      $('.send-new').hide();
      $('#download-progress').show();
      // update progress bar
      document
        .querySelector('#progress-bar')
        .style.setProperty('--progress', percentComplete + '%');
      $('#progress-text').html(`${percentComplete}%`);
      //on complete
      if (percentComplete === 100) {
        fileReceiver.removeAllListeners('progress');
        $('#download-text').html('Download complete!');
        $('.send-new').show();
        $btn.text('Download complete!');
        $btn.attr('disabled', 'true');
        notify('Your download has finished.');
      }
    });

    fileReceiver.on('decrypting', isStillDecrypting => {
      // The file is being decrypted
      if (isStillDecrypting) {
        console.log('Decrypting');
      } else {
        console.log('Done decrypting');
      }
    });

    fileReceiver.on('hashing', isStillHashing => {
      // The file is being hashed to make sure a malicious user hasn't tampered with it
      if (isStillHashing) {
        console.log('Checking file integrity');
      } else {
        console.log('Integrity check done');
      }
    });

    fileReceiver
      .download()
      .catch(() => {
        $('.title').text(
          'This link has expired or never existed in the first place.'
        );
        $('#download-btn').hide();
        $('#expired-img').show();
        console.log('The file has expired, or has already been deleted.');
        return;
      })
      .then(([decrypted, fname]) => {
        name.innerText = fname;
        const dataView = new DataView(decrypted);
        const blob = new Blob([dataView]);
        const downloadUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = downloadUrl;
        if (window.navigator.msSaveBlob) {
          // if we are in microsoft edge or IE
          window.navigator.msSaveBlob(blob, fname);
          return;
        }
        a.download = fname;
        document.body.appendChild(a);
        a.click();
      })
      .catch(err => {
        Raven.captureException(err);
        return Promise.reject(err);
      });
  }
});
