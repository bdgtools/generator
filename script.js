let hasilGlobal = [];
// URL Google Apps Script
const GAS_URL = "https://script.google.com/macros/s/AKfycbzPkU1IngIVVAkdqyb4803fjwWj-xFblnUo2xSypsF1QWvZWh6fK8X_XZUYmMBdT1Xz/exec";


// ======================
// LOGIN
// ======================

function login(){

    const storeCode = document.getElementById("storeCode").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("loginMsg");


    if(storeCode === "" || password === ""){

        msg.innerHTML = "Store Code dan Password wajib diisi";
        return;

    }


    msg.innerHTML = "Checking...";


    fetch(
      GAS_URL +
      "?storeCode=" + encodeURIComponent(storeCode) +
      "&password=" + encodeURIComponent(password)
    )


    .then(response => response.json())


    .then(data => {


        if(data.success === true){


            // sembunyikan login

            document.getElementById("loginPage")
            .style.display="none";


            // tampilkan dashboard

            document.getElementById("dashboardPage")
            .style.display="block";


            document.getElementById("storeInfo").innerHTML =
            "Store : " + data.storeName +
            " (" + data.storeCode + ")";


            // simpan session

            localStorage.setItem(
                "storeCode",
                data.storeCode
            );


        }else{


            msg.innerHTML="Store Code / Password salah atau tidak aktif";


        }


    })


    .catch(error=>{

        console.log(error);

        msg.innerHTML="Gagal koneksi server";

    });


}


// ======================
// LOGOUT
// ======================

function logout(){


    localStorage.removeItem("loginStore");


    document.getElementById("dashboardPage").style.display="none";


    document.getElementById("loginPage").style.display="block";


    document.getElementById("storeCode").value="";

    document.getElementById("password").value="";


}



// ======================
// OPEN MODULE
// ======================

function openModule(module){


    // sembunyikan dashboard

    document.getElementById("dashboardPage")
    .style.display="none";


    // sembunyikan semua module

    document.getElementById("stockModule")
    .style.display="none";


    document.getElementById("salesModule")
    .style.display="none";


    document.getElementById("itemizeModule")
    .style.display="none";


    document.getElementById("reportModule")
    .style.display="none";



    // tampilkan module pilihan


    if(module==="stock"){


        document.getElementById("stockModule")
        .style.display="block";


    }


    if(module==="sales"){


        document.getElementById("salesModule")
        .style.display="block";


    }


    if(module==="itemize"){


        document.getElementById("itemizeModule")
        .style.display="block";


    }


    if(module==="report"){


        document.getElementById("reportModule")
        .style.display="block";


    }


}




// ======================
// BACK DASHBOARD
// ======================

function backDashboard(){


    document.getElementById("stockModule")
    .style.display="none";


    document.getElementById("salesModule")
    .style.display="none";


    document.getElementById("itemizeModule")
    .style.display="none";


    document.getElementById("reportModule")
    .style.display="none";


    document.getElementById("dashboardPage")
    .style.display="block";


}
// ======================
// GENERATE STOCK BALANCE
// ======================

function generateData(){

    const fisikFile =
    document.getElementById("fisikFile").files[0];

    const sistemFile =
    document.getElementById("sistemFile").files[0];


    if(!fisikFile || !sistemFile){

        alert("Upload kedua file terlebih dahulu");
        return;

    }


    Promise.all([
        readTXT(fisikFile),
        readTXT(sistemFile)
    ])

    .then(files=>{


        const fisik =
        parseFisik(files[0]);


        const sistem =
        parseSistem(files[1]);


        const hasil =
        prosesStock(fisik,sistem);
        
        hasilGlobal = hasil;
        
        tampilkanSummary(hasil);
        
        tampilkanHasil(hasil);


    });


}
function readTXT(file){

return new Promise((resolve,reject)=>{


    let reader=new FileReader();


    reader.onload=e=>{

        resolve(e.target.result);

    };


    reader.onerror=reject;


    reader.readAsText(file);


});

}
function parseFisik(text){


let data={};


let rows=text.split(/\r?\n/);


rows.forEach(row=>{


    let col=row.split(",");


    if(col.length>=3){


        let sku=col[1].trim();


        let qty=
        Number(col[2]) || 0;



        if(sku){


            if(data[sku]){

                data[sku]+=qty;

            }else{

                data[sku]=qty;

            }


        }


    }


});


return data;


}
function parseSistem(text){


let data={};


let rows=text.split(/\r?\n/);


rows.forEach(row=>{


let col=row.split(",");



if(col.length>=9){


let sku=col[0].trim();



data[sku]={


rack:col[1],

price:col[2],

system:Number(col[3]) || 0,

desc:col[8]


};



}


});


return data;


}
function prosesStock(fisik, sistem){

    let hasil = [];

    // Hanya loop SKU yang ada di scan fisik
    Object.keys(fisik).forEach(sku=>{

        if(sistem[sku]){

            let qtySystem = sistem[sku].system;
            let qtyFisik = fisik[sku];

            let selisih = qtySystem - qtyFisik;

            let status = "Tally";

            if(selisih < 0){
                status = "Short";
            }else if(selisih > 0){
                status = "Extra";
            }

            hasil.push({

                sku: sku,
                rack: sistem[sku].rack,
                desc: sistem[sku].desc,
                system: qtySystem,
                fisik: qtyFisik,
                selisih: selisih,
                status: status

            });

        }else{

            // SKU scan tetapi tidak ada di Export Shelf
            hasil.push({

                sku: sku,
                rack: "-",
                desc: "SKU Tidak Ada Di Export Shelf",
                system: 0,
                fisik: fisik[sku],
                selisih: -fisik[sku],
                status: "Not In System"

            });

        }

    });

    // Urutkan berdasarkan rack
    hasil.sort((a,b)=>{

        if(a.rack === "-") return 1;
        if(b.rack === "-") return -1;

        return a.rack.localeCompare(
            b.rack,
            undefined,
            {
                numeric:true,
                sensitivity:"base"
            }
        );

    });

    return hasil;

}
function tampilkanSummary(data){


let totalSKU = data.length;

let tally = 0;
let short = 0;
let extra = 0;


data.forEach(row=>{


    if(row.status=="Tally"){

        tally++;

    }


    if(row.status=="Short"){

        short++;

    }


    if(row.status=="Extra"){

        extra++;

    }


});



let html = `

<div class="summary">


<div class="card total">

<h3>${totalSKU}</h3>
<p>Total SKU</p>

</div>



<div class="card tally">

<h3>${tally}</h3>
<p>Tally</p>

</div>



<div class="card short">

<h3>${short}</h3>
<p>Short</p>

</div>



<div class="card extra">

<h3>${extra}</h3>
<p>Extra</p>

</div>


</div>

`;



document.getElementById("summary")
.innerHTML = html;


}
function tampilkanHasil(data){


let html=`


<div style="
max-height:500px;
overflow:auto;
">


<table>


<thead>

<tr>

<th>SKU</th>
<th>Rack</th>
<th>Description</th>
<th>System</th>
<th>Fisik</th>
<th>Selisih</th>
<th>Status</th>


</tr>

</thead>


<tbody>


`;



data.forEach(row=>{


let cls="sama";


if(row.status=="Not In System"){

    cls="notSystem";

}


if(row.status=="Short"){

    cls="minus";

}


if(row.status=="Extra"){

    cls="plus";

}


if(row.status=="Not In System"){

    cls="notSystem";

}


html+=`

<tr class="${cls}">

<td>${row.sku}</td>

<td>${row.rack}</td>

<td>${row.desc}</td>

<td>${row.system}</td>

<td>${row.fisik}</td>

<td>${row.selisih}</td>

<td>${row.status}</td>


</tr>


`;


});



html+=`

</tbody>

</table>

</div>

`;



document.getElementById("hasil")
.innerHTML=html;


}
function downloadExcel(){


    if(hasilGlobal.length === 0){

        alert("Belum ada data hasil generate");
        return;

    }



    let exportData = hasilGlobal.map(row=>{


        return {

            SKU: row.sku,

            Rack: row.rack,

            Description: row.desc,

            "Qty System": row.system,

            "Qty Fisik": row.fisik,

            "Selisih": row.selisih,

            Status: row.status

        };


    });



    let ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [

    {wch:15}, // SKU
    {wch:15}, // Rack
    {wch:35}, // Description
    {wch:12},
    {wch:12},
    {wch:12},
    {wch:15}

];



    let wb = XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Stock Balance"
    );



    XLSX.writeFile(
        wb,
        "Stock_Balance_Result.xlsx"
    );


}

