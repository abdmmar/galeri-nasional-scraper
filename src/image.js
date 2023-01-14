import download from 'image-downloader'
import fs from 'fs/promises'
import path from 'path'

const collectionURL = 'http://galeri-nasional.or.id/upload/collection/';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function currentImages() {
  return await fs.readdir(path.join(process.cwd(), 'data/images'))
}

(async function main() {
  try {
    const images = await currentImages()
    const data = await fs.readFile(path.join(process.cwd(), 'db.json'))
    const { gallery } = JSON.parse(data)

    for (const item of gallery) {
      const imageURL = item?.image
      if (imageURL) {
        const filename = imageURL.replace(collectionURL, '')
        if (!images.includes(filename)) {
          const result = await download.image({ url: imageURL, dest: path.join(process.cwd(), 'data/images') })
          if (result.filename) {
            console.log('Successfully saved to', filename)
            sleep(3000)
          }
        }
      }
    }
  } catch (error) {
    console.error(error)
  }
})()