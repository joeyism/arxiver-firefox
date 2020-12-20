const SHORTENED_TEXT_LENGTH = 15
const TABLE_HEADER_NAMES = ["Paper Name", "Authors", "Summary", "Site", "PDF"]

const reportError = (error) => {
    console.error(`Could not arxiver: ${error}`);
}
const toggleElementById = (id) => {
  const x = document.getElementById(id);
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
  const arrow = document.getElementById(`${id}-arrow`);
  if (arrow != undefined) {
      if (arrow.className == "arrow right"){
        arrow.className = "arrow down"
      }
      else {
        arrow.className = "arrow right"
      }
  }
} 

const extractIdFromUrl = (url) => {
    if (url.endsWith("pdf")){
        const url_split = url.split("/")
        id_and_pdf = url_split[url_split.length - 1].split(".")
        id_and_pdf.pop()
        return id_and_pdf.join(".")
    }
    else {
        const url_split = url.split("/")
        return url_split[url_split.length - 1]
    }
}

const get = async (url) => {
    const request = new Request(url)
    return await fetch(request)
}

const getArxivData = async (id) => {
    return await get("https://arxiver.herokuapp.com/" + id)
}

const save = async (tabs) => {
    url = tabs[0].url
    arxivId = extractIdFromUrl(url)
    results = await getArxivData(arxivId)
    body = await results.json()
    let arxivData = await browser.storage.local.get("arxiv_data")
    console.log(arxivData)
    if (Object.keys(arxivData).length === 0 && arxivData.constructor === Object){
        arxivData = {"arxiv_data": {}}
    }
    arxivData["arxiv_data"][arxivId] = body
    await browser.storage.local.set(arxivData)
    render()
}

const shorten = (text) => {
    return text.substring(0, SHORTENED_TEXT_LENGTH) + "..."
}

const createTableHeader = () => {
    const row = document.createElement("tr")
    TABLE_HEADER_NAMES.forEach(header => {
      const cell = document.createElement("th")
      cell.appendChild(document.createTextNode(header))
      row.appendChild(cell)
    })
    return row
}

const createTableRow = (arxivBody) => {
    const row = document.createElement("tr")
    const data = [arxivBody.title, arxivBody.author, arxivBody.summary]
    data.forEach(val => {
      const cell = document.createElement("td")
      cell.appendChild(document.createTextNode(shorten(val)))
      row.appendChild(cell);
    })

    const siteCell = document.createElement("td")
    const site = document.createElement("a")
    site.href = arxivBody.id
    site.appendChild(document.createTextNode("Site"))
    siteCell.append(site)
    row.append(siteCell)

    const pdfCell = document.createElement("td")
    const pdf = document.createElement("a")
    pdf.href = arxivBody.id
    pdf.appendChild(document.createTextNode("PDF"))
    pdfCell.append(pdf)
    row.append(pdfCell)
    return row
}

const renderTable = (arxivData) => {
    const mainTable = document.getElementById("main-table")
    mainTable.innerHTML = ""
    mainTable.append(createTableHeader())
    arxivData.forEach(arxivBody => {
      const row = createTableRow(arxivBody)
      mainTable.append(row)
    })
}

const render = async () => {
    const results = await browser.storage.local.get("arxiv_data")
    arxivData = results["arxiv_data"] || []
    renderTable(Object.values(arxivData))
}

const filterArxivDataByText = (arxivData, text) => {
    return arxivData.filter((arxivBody) => {
        return arxivBody.summary.indexOf(text) > -1 || arxivBody.title.indexOf(text) > -1 || arxivBody.author.indexOf(text) > -1
    })
}

document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("save")) {
        const tabs = await browser.tabs.query({active: true, currentWindow: true})
        await save(tabs)
    }
    else if (e.target.id == "toggle-table"){
        toggleElementById("table-div")
    }
})

document.getElementById("search").addEventListener("input", async (e) => {
    const elem = e.target
    const searchValue = elem.value
    const results = await browser.storage.local.get("arxiv_data")
    const arxivData = Object.values(results["arxiv_data"])
    const filteredArxivData = filterArxivDataByText(arxivData, searchValue)
    renderTable(filteredArxivData)
})


browser.tabs.executeScript({file: "/content_scripts/main.js"})
.then(console.log)
.catch(console.error);
try {
    render()
} catch(e) {
    console.error(e)
}
