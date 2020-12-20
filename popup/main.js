const SHORTENED_TEXT_LENGTH = 25
const TABLE_HEADER_NAMES = ["Paper Name", "Authors", "Summary", "Site", "PDF", ""]

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

const saveLink = async (tabs) => {
    url = tabs[0].url
    arxivId = extractIdFromUrl(url)
    results = await getArxivData(arxivId)
    body = await results.json()
    let arxivData = await browser.storage.local.get("arxiv_data")
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

const createTableRow = (arxivId, arxivBody) => {
    const row = document.createElement("tr")
    const data = [arxivBody.title, arxivBody.author, arxivBody.summary]
    data.forEach(val => {
      const cell = document.createElement("td")
      const div = document.createElement("div")
      const span = document.createElement("span")
      span.title = val
      span.appendChild(document.createTextNode(shorten(val)))
      div.appendChild(span)
      cell.appendChild(div)
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

    const removeCell = document.createElement("td")
    const x_span = document.createElement("span")
    x_span.id = `${arxivId}-remove`
    x_span.className = "remove"
    x_span.appendChild(document.createTextNode("❌"))
    removeCell.append(x_span)
    row.append(removeCell)
    return row
}

const renderTable = (arxivData) => {
    const mainTable = document.getElementById("main-table")
    mainTable.innerHTML = ""
    mainTable.append(createTableHeader())
    arxivData.forEach(eachData => {
      const row = createTableRow(eachData[0], eachData[1])
      mainTable.append(row)
    })
}

const render = async () => {
    const results = await browser.storage.local.get("arxiv_data")
    arxivData = results["arxiv_data"] || []
    renderTable(Object.entries(arxivData))
}

const removeRow = async(id) => {
    const arxivData = await browser.storage.local.get("arxiv_data")
    delete arxivData["arxiv_data"][id]
    await browser.storage.local.set(arxivData)
    renderTable(Object.entries(arxivData["arxiv_data"]))
}

const filterArxivDataByText = (arxivData, text) => {
    return arxivData.filter(eachArxivData => {
        arxivId = eachArxivData[0]
        arxivBody = eachArxivData[1]
        return arxivBody.summary.indexOf(text) > -1 || arxivBody.title.indexOf(text) > -1 || arxivBody.author.indexOf(text) > -1
    })
}

document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("save")) {
        const tabs = await browser.tabs.query({active: true, currentWindow: true})
        await saveLink(tabs)
    }
    else if (e.target.id == "toggle-table"){
        toggleElementById("table-div")
    }
    else if (e.target.id.endsWith("-remove")){
        await removeRow(e.target.id.substring(0, e.target.id.length - 7))
    }
})

document.getElementById("search").addEventListener("input", async (e) => {
    const elem = e.target
    const searchValue = elem.value
    const results = await browser.storage.local.get("arxiv_data")
    const arxivData = Object.entries(results["arxiv_data"])
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
