const NetlifyAPI = require('netlify')
const Downloader = require('nodejs-file-downloader')
const client = new NetlifyAPI('<access-token-here>');

(async () => {

  const files = await client.listSiteFiles({
    site_id: '<API ID here>'
  })

  files.forEach(async (file) => {

    const downloader = new Downloader({
      url: '<URL here>' + file.path,
      directory: './download' + file.path.substring(0, file.path.lastIndexOf('/') + 1)
    })

    try {
      await downloader.download()
      console.log(file.path + ' done')
    } catch (error) {
      console.log(file.path + ' failed', error)
    }
  })

})()
Go to https://app.netlify.com/user/applications#personal-access-tokens and create a new access token. Replace <access-token-here> in line 3 with the token you just created.

Then, go to https://app.netlify.com/sites/<site-name>/settings/general#site-information and copy the API ID of your website. Replace <API ID here> in line 8 with the value you just copied.

Finally, in line 14, replace <URL here> with the full URL of your website (without the trailing slash /).

Then, in the terminal, run npm i netlify nodejs-file-downloader.

Once the packages are installed, run npm index.js. The files would be downloaded to a folder named download relative to the location of the above file.
