import * as fsp from 'fs/promises'
import fetch from 'node-fetch'
import * as cheerio from 'cheerio'

const collections = {
  total: 0,
  paintings: {
    total: 0,
    data: [],
  },
  sculptures: {
    total: 0,
    data: [],
  },
  others: {
    total: 0,
    data: [],
  },
}

let child_position = 1

const nav = {
  prev: '#nav-prev > a', // Older collection
  next: '#nav-next > a', // Newer collection
}

const paintingsUrl =
  'http://galeri-nasional.or.id/collections/096-kapal_karam_dilanda_badai'
const sculpturesUrl = 'http://galeri-nasional.or.id/collections/540-pasangan'
const othersUrl = 'http://galeri-nasional.or.id/collections/476-buka_mulutmu'

async function main() {
  await addCollections(paintingsUrl)
  await addCollections(sculpturesUrl)
  await addCollections(othersUrl)

  await writeFile('galeri-nasional.json', collections)

  console.log('Galeri National Collections is complete!')
}

main()

async function addCollections(url) {
  let $ = await getDocument(url)
  let type = getTypeCollection($)
  let next = $(nav.prev).attr('href')

  while (url != null) {
    const collection = getCollection($)
    collection.link = url

    console.log(collection)

    // Add collection to collections based on its type: Lukisan, Patung, atau Lain-lain
    addToCollections(type, collection)

    // Set url to next collection url
    url = next
    child_position = 1

    // Get next collection
    if (next != null) {
      $ = await getDocument(next)
      type = getTypeCollection($)
      next = $(nav.prev).attr('href')
    }
  }
}

async function writeFile(filename, data) {
  try {
    await fsp.writeFile(filename, JSON.stringify(data))
    console.log(`${filename} is written successfully`)
  } catch (error) {
    console.log(error)
  }
}

function addToCollections(type, collection) {
  switch (type) {
    case 'Lukisan':
      collections.total++
      collections.paintings.total++
      collections.paintings.data.push(collection)
      break

    case 'Patung':
      collections.total++
      collections.sculptures.total++
      collections.sculptures.data.push(collection)
      break

    case 'Lain-lain':
      collections.total++
      collections.others.total++
      collections.others.data.push(collection)
      break

    default:
      break
  }
}

async function getDocument(url) {
  const response = await fetch(url)
  const html = await response.text()
  const $ = cheerio.load(html)

  return $
}

function getCollection($) {
  const collection = {
    title: getTitle($),
    image: getImage($),
    artist: getArtist($),
    year: getYear($),
    size: getSize($),
    medium: getMedium($),
    description: getDescription($),
    link: null,
  }

  return collection
}

function getTypeCollection($) {
  return $('#judul-halaman').text().trim().split(' : ').at(0)
}

function getImage($) {
  const image = $(`#konten-box > p:nth-child(${child_position}) > img`).attr(
    'src',
  )
  child_position = image == null ? 0 : 1

  return image
}
function getTitle($) {
  return $('#konten-box > h2')
    .text()
    .trim()
    .split(' : ')
    .at(1)
    .replace('"', '')
    .replace('"', '')
    .trim()
}
function getArtist($) {
  return {
    name: $(`#konten-box > p:nth-child(${child_position + 2})`)
      .text()
      .trim()
      .split(' : ')
      .at(1),
    link: $(`#konten-box > p:nth-child(${child_position + 2}) > a`).attr(
      'href',
    ),
  }
}
function getYear($) {
  return parseInt(
    $(`#konten-box > p:nth-child(${child_position + 3})`)
      .text()
      .trim()
      .split(' : ')
      .at(1),
  )
}
function getMedium($) {
  return $(`#konten-box > p:nth-child(${child_position + 4})`)
    .text()
    .trim()
}
function getSize($) {
  return $(`#konten-box > p:nth-child(${child_position + 5})`)
    .text()
    .trim()
    .split(': ')
    .at(1)
}
function getDescription($) {
  let description = ''
  let count_child = 7

  while (count_child != null) {
    let desc_query = `#konten-box > p:nth-child(${count_child})`
    let result = $(desc_query).text()

    if (result == null || result == '&nbsp;' || result == '') {
      count_child = null
    } else if (result == '\\r\\n\\r\\n') {
      count_child++
    } else {
      count_child++
      description += `${result.trim()}`
    }
  }

  return description
}
