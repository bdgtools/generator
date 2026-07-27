const GAS_URL = "https://script.google.com/macros/s/AKfycbzPkU1IngIVVAkdqyb4803fjwWj-xFblnUo2xSypsF1QWvZWh6fK8X_XZUYmMBdT1Xz/exec";


let dataFisik = {};
let dataSistem = {};



// membaca file fisik

function bacaFisik(file){

return new Promise((resolve)=>{


let reader = new FileReader();


reader.onload=function(e){


let rows=e.target.result
.split(/\r?\n/)
.filter(x=>x.trim()!="");


let hasil={};


rows.forEach(row=>{


let col=row.split(",");


let rack=col[0].trim();
let sku=col[1].trim();
let qty=Number(col[2]);


if(!hasil[sku]){

hasil[sku]={
rack:rack,
qty:0
};

}


hasil[sku].qty += qty;


});


resolve(hasil);


};


reader.readAsText(file);


});


}




// membaca file sistem

function bacaSistem(file){

return new Promise((resolve)=>{


let reader=new FileReader();


reader.onload=function(e){


let rows=e.target.result
.split(/\r?\n/)
.filter(x=>x.trim()!="");


let hasil={};


rows.forEach(row=>{


let col=row.split(",");


let sku=col[0].trim();


hasil[sku]={

system:col[3],
desc:col[8]

};


});


resolve(hasil);


};


reader.readAsText(file);


});

}
function openModule(module){

    document.getElementById("dashboardPage").style.display="none";

    document.getElementById("stockModule").style.display="none";

    document.getElementById("salesModule").style.display="none";

    document.getElementById("itemizeModule").style.display="none";

    document.getElementById("reportModule").style.display="none";

    if(module=="stock")
        document.getElementById("stockModule").style.display="block";

    if(module=="sales")
        document.getElementById("salesModule").style.display="block";

    if(module=="itemize")
        document.getElementById("itemizeModule").style.display="block";

    if(module=="report")
        document.getElementById("reportModule").style.display="block";

}
async function generateData(){

  let fisikFiles = document.getElementById("fisikFile").files;

  let sistem = document.getElementById("sistemFile").files[0];


  if(fisikFiles.length==0 || !sistem){

    alert("Upload file fisik dan sistem terlebih dahulu");

    return;

  }


  dataFisik={};


  for(let i=0;i<fisikFiles.length;i++){


    let hasil = await bacaFisik(fisikFiles[i]);


    Object.keys(hasil).forEach(sku=>{


      if(!dataFisik[sku]){

        dataFisik[sku]=hasil[sku];

      }
      else{

        dataFisik[sku].qty += hasil[sku].qty;

      }


    });


  }


  dataSistem = await bacaSistem(sistem);


  tampilkan();

function tampilkan(){

let totalSKU = Object.keys(dataFisik).length;

let tally = 0;
let extra = 0;
let short = 0;


let html=`

<table>

<thead>

<tr>
<th>SKU</th>
<th>Rack Number</th>
<th>Physical</th>
<th>System</th>
<th>Variance</th>
<th>Description</th>
</tr>

</thead>

<tbody>

`;


Object.keys(dataFisik)
.sort((a,b)=>{

return dataFisik[a].rack.localeCompare(
dataFisik[b].rack,
undefined,
{
numeric:true,
sensitivity:"base"
}
);

})
.forEach(sku=>{


let fisik=dataFisik[sku];

let sistem=dataSistem[sku] || {};

let qtySistem=Number(sistem.system)||0;

let selisih=fisik.qty-qtySistem;


if(selisih==0){

tally++;

}
else if(selisih>0){

extra++;

}
else{

short++;

}


let warna="";

if(selisih>0){

warna="plus";

}
else if(selisih<0){

warna="minus";

}
else{

warna="sama";

}



html+=`

<tr>

<td>${sku}</td>

<td>${fisik.rack}</td>

<td>${fisik.qty}</td>

<td>${qtySistem}</td>

<td class="${warna}">
${selisih}
</td>

<td>${sistem.desc || "-"}</td>

</tr>

`;



});


html+=`

</tbody>

</table>

`;


document.getElementById("summary").innerHTML=

`

<div class="summary">

<div class="card total">
Total SKU<br>${totalSKU}
</div>

<div class="card tally">
Tally (0)<br>${tally}
</div>

<div class="card extra">
Extra (+)<br>${extra}
</div>

<div class="card short">
Short (-)<br>${short}
</div>

</div>

`;


document.getElementById("hasil").innerHTML=html;


function filterTabel(){

let keyword = document
.getElementById("search")
.value
.toLowerCase();


let filter = document
.getElementById("filter")
.value;


let rows = document
.querySelectorAll("#hasil table tr");


rows.forEach((row,index)=>{


if(index==0) return;


let text=row.innerText.toLowerCase();


let cocokCari=text.includes(keyword);


let cocokFilter=true;


if(filter!="all"){

let selisihCell=row.children[4];


cocokFilter=
selisihCell.classList.contains(filter);

}


if(cocokCari && cocokFilter){

row.style.display="";

}
else{

row.style.display="none";

}


});


function downloadExcel(){

let hasilExport = [];


Object.keys(dataFisik).forEach(sku=>{

  let fisik = dataFisik[sku];

  let sistem = dataSistem[sku] || {};

  let qtySistem = Number(sistem.system) || 0;

  let selisih = fisik.qty - qtySistem;


  // hanya ambil yang berbeda
  if(selisih != 0){

    hasilExport.push({

      "SKU": sku,

      "Rack Number": fisik.rack,

      "Fisik": fisik.qty,

      "Sistem": qtySistem,

      "Selisih": selisih,

      "Status": selisih > 0 ? "EXTRA" : "SHORT",

      "Deskripsi": sistem.desc || "-"

    });

  }


});


if(hasilExport.length === 0){

  alert("Tidak ada selisih. Semua SKU tally.");

  return;

}


// buat excel

let worksheet =
XLSX.utils.json_to_sheet(hasilExport);


let workbook =
XLSX.utils.book_new();


XLSX.utils.book_append_sheet(
  workbook,
  worksheet,
  "Stock Difference"
);


// nama file

let store =
sessionStorage.getItem("storeCode") || "STORE";


let tanggal =
new Date()
.toISOString()
.slice(0,10);


XLSX.writeFile(
  workbook,
  `Stock_Check_${store}_${tanggal}.xlsx`
);


async function login(){

  const store = document.getElementById("storeCode").value.trim().toUpperCase();
  const pass = document.getElementById("password").value.trim();

  if(store === "" || pass === ""){
    document.getElementById("loginMsg").innerHTML = "Store Code dan Password wajib diisi.";
    return;
  }

  document.getElementById("loginMsg").innerHTML = "Sedang login...";

  try{

    const response = await fetch(
      `${GAS_URL}?storeCode=${encodeURIComponent(store)}&password=${encodeURIComponent(pass)}`
    );

    const result = await response.json();

    if(result.success){

      sessionStorage.setItem("storeCode", result.storeCode);
      sessionStorage.setItem("storeName", result.storeName);

      document.getElementById("loginPage").style.display = "none";
      document.getElementById("loginMsg").innerHTML = "";

      if(document.getElementById("storeInfo")){
        document.getElementById("storeInfo").innerHTML =
          `${result.storeCode} - ${result.storeName}`;
      }

    }else{

      document.getElementById("loginMsg").innerHTML =
        "Store Code / Password salah atau user tidak aktif.";

    }

  }catch(err){

    console.error(err);

    document.getElementById("loginMsg").innerHTML =
      "Tidak dapat terhubung ke server.";

  }

function backDashboard(){

    document.getElementById("stockModule").style.display="none";
    document.getElementById("salesModule").style.display="none";
    document.getElementById("itemizeModule").style.display="none";
    document.getElementById("reportModule").style.display="none";

    document.getElementById("dashboardPage").style.display="block";

}

function logout(){

  sessionStorage.clear();
  document.getElementById("loginPage").style.display = "block";

  document.getElementById("password").value = "";
  document.getElementById("loginMsg").innerHTML = "";
}

window.onload = function(){

  if(sessionStorage.getItem("storeCode")){

    document.getElementById("loginPage").style.display = "none";
    document.getElementById("dashboardPage").style.display = "block";

    document.getElementById("storeInfo").innerHTML =
      sessionStorage.getItem("storeCode") +
      " - " +
      sessionStorage.getItem("storeName");

  }

}
