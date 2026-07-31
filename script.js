/* =====================================================
   MR DIY STORE TOOLS v2.0
   MAIN SCRIPT
===================================================== */


let hasilGlobal = [];

let itemizeGlobal = [];


// GOOGLE APPS SCRIPT URL

const GAS_URL =
"https://script.google.com/macros/s/AKfycbzPkU1IngIVVAkdqyb4803fjwWj-xFblnUo2xSypsF1QWvZWh6fK8X_XZUYmMBdT1Xz/exec";





/* =====================================================
   STORE INFO
===================================================== */


function updateStoreInfo(storeCode,storeName){


    document
    .querySelectorAll(".storeInfo")
    .forEach(el=>{


        el.innerHTML =
        `${storeCode} - ${storeName || ""}`;


    });


}








/* =====================================================
   LOGIN
===================================================== */


function login(){


    const storeCode =
    document
    .getElementById("storeCode")
    .value
    .trim();



    const password =
    document
    .getElementById("password")
    .value
    .trim();



    const msg =
    document
    .getElementById("loginMsg");





    if(!storeCode || !password){


        msg.innerHTML =
        "Store Code dan Password wajib diisi";


        return;

    }





    msg.innerHTML =
    "Checking...";





    const url =

    GAS_URL +

    "?action=login" +

    "&storeCode=" +
    encodeURIComponent(storeCode) +

    "&password=" +
    encodeURIComponent(password);







    fetch(url)


    .then(res=>res.json())


    .then(data=>{



        console.log(data);





        if(data.success){



            localStorage.setItem(
                "storeCode",
                data.storeCode
            );



            localStorage.setItem(
                "storeName",
                data.storeName
            );





            document
            .getElementById("loginPage")
            .style.display="none";





            document
            .getElementById("dashboardPage")
            .style.display="block";





            updateStoreInfo(
                data.storeCode,
                data.storeName
            );





            loadItemize();





        }else{


            msg.innerHTML =
            "Store Code / Password salah";


        }




    })


    .catch(err=>{


        console.error(err);


        msg.innerHTML =
        "Connection Error";


    });



}








/* =====================================================
   AUTO LOGIN SESSION
===================================================== */


document.addEventListener(
"DOMContentLoaded",
()=>{


    const storeCode =
    localStorage.getItem("storeCode");



    const storeName =
    localStorage.getItem("storeName");





    if(storeCode){



        document
        .getElementById("loginPage")
        .style.display="none";



        document
        .getElementById("dashboardPage")
        .style.display="block";



        updateStoreInfo(
            storeCode,
            storeName
        );



        loadItemize();


    }




    const btn =
    document.getElementById("loginBtn");



    if(btn){


        btn.addEventListener(
            "click",
            login
        );


    }



});








/* =====================================================
   LOGOUT
===================================================== */


function logout(){



    localStorage.removeItem(
        "storeCode"
    );


    localStorage.removeItem(
        "storeName"
    );



    hasilGlobal=[];


    itemizeGlobal=[];





    document
    .querySelectorAll(".modulePage")
    .forEach(el=>{


        el.style.display="none";


    });





    document
    .getElementById("dashboardPage")
    .style.display="none";





    document
    .getElementById("loginPage")
    .style.display="block";





    document
    .getElementById("storeCode")
    .value="";



    document
    .getElementById("password")
    .value="";



}









/* =====================================================
   MODULE CONTROL
===================================================== */


function openModule(module){



    document
    .getElementById("dashboardPage")
    .style.display="none";





    document
    .querySelectorAll(".modulePage")
    .forEach(el=>{


        el.style.display="none";


    });





    const target =
    document.getElementById(
        module+"Module"
    );





    if(target){


        target.style.display="block";


    }



}









function backDashboard(){



    document
    .querySelectorAll(".modulePage")
    .forEach(el=>{


        el.style.display="none";


    });





    document
    .getElementById("dashboardPage")
    .style.display="block";



}
/* =====================================================
   STOCK BALANCE MODULE
===================================================== */



function generateData(){


    const sistemFile =
    document
    .getElementById("sistemFile")
    .files[0];



    const fisikFiles =
    document
    .getElementById("fisikFile")
    .files;





    if(!sistemFile || fisikFiles.length===0){


        alert(
        "Upload Export Shelf dan Scan Fisik terlebih dahulu"
        );


        return;

    }







    let proses=[];



    proses.push(
        readTXT(sistemFile)
    );





    for(let i=0;i<fisikFiles.length;i++){


        proses.push(
            readTXT(fisikFiles[i])
        );


    }





    Promise.all(proses)

    .then(files=>{



        const sistem =
        parseSistem(files[0]);



        let fisik={};





        for(let i=1;i<files.length;i++){


            let scan =
            parseFisik(files[i]);



            Object.keys(scan)
            .forEach(sku=>{


                if(!fisik[sku]){


                    fisik[sku]=0;


                }



                fisik[sku]+=scan[sku];



            });



        }






        hasilGlobal =
        prosesStock(
            fisik,
            sistem
        );






        tampilkanSummary(
            hasilGlobal
        );



        tampilkanHasil(
            hasilGlobal
        );





    })

    .catch(err=>{


        console.error(err);


        alert(
        "Gagal membaca file"
        );


    });



}








function readTXT(file){



    return new Promise(
    (resolve,reject)=>{



        let reader =
        new FileReader();




        reader.onload =
        e=>{


            resolve(
                e.target.result
            );


        };




        reader.onerror =
        reject;



        reader.readAsText(file);



    });



}









function parseFisik(text){



    let data={};



    let rows =
    text.split(/\r?\n/);





    rows.forEach(row=>{



        let col =
        row.split(",");




        if(col.length>=3){



            let sku =
            col[1]
            .trim();



            let qty =
            Number(
            col[2]
            ) || 0;





            if(sku){



                if(!data[sku]){


                    data[sku]=0;


                }



                data[sku]+=qty;



            }


        }



    });




    return data;



}









function parseSistem(text){



    let data={};



    let rows =
    text.split(/\r?\n/);





    rows.forEach(row=>{



        let col =
        row.split(",");





        if(col.length>=9){



            let sku =
            col[0]
            .trim();




            if(sku){



                data[sku]={



                    rack:
                    col[1]
                    .trim(),



                    price:
                    col[2]
                    .trim(),



                    system:
                    Number(col[3])
                    ||0,



                    desc:
                    col[8]
                    .trim()



                };



            }




        }




    });




    return data;



}









function prosesStock(fisik,sistem){



    let hasil=[];





    Object.keys(fisik)

    .forEach(sku=>{



        let row={};



        if(sistem[sku]){



            let sys =
            sistem[sku]
            .system;



            let fis =
            fisik[sku];



            let sel =
            sys-fis;





            let status =
            "Tally";



            if(sel<0){

                status="Short";

            }

            else if(sel>0){

                status="Extra";

            }







            row={


                sku:sku,

                rack:
                sistem[sku].rack,

                desc:
                sistem[sku].desc,

                system:sys,

                fisik:fis,

                selisih:sel,

                status:status


            };



        }

        else{



            row={


                sku:sku,

                rack:"-",


                desc:
                "SKU Tidak Ada Di Export Shelf",


                system:0,


                fisik:fisik[sku],


                selisih:
                -fisik[sku],


                status:
                "Not In System"



            };


        }






        hasil.push(row);




    });








    hasil.sort(
    (a,b)=>{



        if(a.rack==="-")


        return 1;




        if(b.rack==="-")


        return -1;





        return a.rack.localeCompare(
            b.rack,
            undefined,
            {
                numeric:true
            }
        );



    });



    return hasil;



}
/* =====================================================
   STOCK RESULT DISPLAY
===================================================== */



function tampilkanSummary(data){


    let total =
    data.length;


    let tally=0;
    let short=0;
    let extra=0;



    data.forEach(row=>{


        if(row.status==="Tally"){

            tally++;

        }


        if(row.status==="Short"){

            short++;

        }


        if(row.status==="Extra"){

            extra++;

        }



    });





    let html=`


    <div class="summary">


        <div class="card total">

            <h3>${total}</h3>

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



    document
    .getElementById("summary")
    .innerHTML=html;



}









function tampilkanHasil(data){


    let html=`


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



        if(row.status==="Short"){


            cls="minus";


        }


        else if(row.status==="Extra"){


            cls="plus";


        }


        else if(row.status==="Not In System"){


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


    `;




    document
    .getElementById("hasil")
    .innerHTML=html;



}









/* =====================================================
   SEARCH & FILTER
===================================================== */


function filterTabel(){



    const keyword =

    document
    .getElementById("search")
    .value
    .toLowerCase();




    const filter =

    document
    .getElementById("filter")
    .value;





    let data =
    hasilGlobal.filter(row=>{





        let cocokSearch =



        row.sku
        .toLowerCase()
        .includes(keyword)



        ||



        row.desc
        .toLowerCase()
        .includes(keyword);







        let cocokFilter=true;





        if(filter==="plus"){


            cocokFilter =
            row.status==="Extra";


        }





        if(filter==="minus"){


            cocokFilter =
            row.status==="Short";


        }





        if(filter==="sama"){


            cocokFilter =
            row.status==="Tally";


        }





        return cocokSearch && cocokFilter;



    });






    tampilkanHasil(data);



}









/* =====================================================
   DOWNLOAD EXCEL STOCK
===================================================== */


function downloadExcel(){



    if(hasilGlobal.length===0){


        alert(
        "Belum ada data hasil"
        );


        return;


    }







    let exportData =

    hasilGlobal.map(row=>({


        SKU:
        row.sku,


        Rack:
        row.rack,


        Description:
        row.desc,


        Qty_System:
        row.system,


        Qty_Fisik:
        row.fisik,


        Selisih:
        row.selisih,


        Status:
        row.status



    }));






    let ws =

    XLSX.utils
    .json_to_sheet(exportData);







    ws["!cols"]=[


        {wch:15},


        {wch:15},


        {wch:40},


        {wch:12},


        {wch:12},


        {wch:12},


        {wch:15}



    ];






    let wb =

    XLSX.utils
    .book_new();





    XLSX.utils
    .book_append_sheet(

        wb,

        ws,

        "Stock Balance"

    );






    let date =
    new Date();




    let filename =

    "StockBalance_" +

    date.getFullYear()+"-"+

    String(
    date.getMonth()+1
    )
    .padStart(2,"0")+"-"+

    String(
    date.getDate()
    )
    .padStart(2,"0")+

    ".xlsx";






    XLSX.writeFile(
        wb,
        filename
    );



}
/* =====================================================
   ITEMIZE MODULE
===================================================== */



function generateItemize(){


    const masterFile =

    document
    .getElementById("itemizeMasterFile")
    .files[0];



    const scanFiles =

    document
    .getElementById("itemizeScanFile")
    .files;






    if(!masterFile || scanFiles.length===0){


        alert(
        "Upload Master dan Scan TXT terlebih dahulu"
        );


        return;


    }






    let files=[];



    files.push(
        readTXT(masterFile)
    );




    for(let i=0;i<scanFiles.length;i++){


        files.push(
            readTXT(scanFiles[i])
        );


    }





    Promise.all(files)

    .then(data=>{



        let master =

        parseItemizeMaster(
            data[0]
        );




        let scan={};





        for(let i=1;i<data.length;i++){



            let result =

            parseItemizeScan(
                data[i]
            );




            Object.keys(result)

            .forEach(sku=>{


                if(!scan[sku]){


                    scan[sku]=[];


                }





                result[sku]
                .forEach(rack=>{


                    if(
                    !scan[sku]
                    .includes(rack)
                    ){


                        scan[sku]
                        .push(rack);


                    }



                });




            });




        }







        itemizeGlobal =

        prosesItemize(
            master,
            scan
        );






        tampilkanItemizeSummary(
            itemizeGlobal
        );



        tampilkanItemizeResult(
            itemizeGlobal
        );






        saveItemize(itemizeGlobal);


    })

    .catch(err=>{


        console.error(err);


        alert(
        "Gagal proses Itemize"
        );


    });



}









function parseItemizeMaster(text){


    let master={};



    let rows =
    text.split(/\r?\n/);





    rows.forEach(row=>{



        let col =
        row.split(",");





        if(col.length>=9){



            let sku =
            col[0]
            .trim();





            if(sku){



                let qtySystem =
                   Number(col[3]) || 0;
               
               // SKIP SKU SYSTEM 0
               if(qtySystem <= 0){
                  
                  return;}
               
               master[sku]={
                  
                  sku:sku,
                  rack:
                     col[1]
                     .trim(),
                  desc:
                     col[8]
                     .trim(),
                  system:
                     qtySystem
               };
            }
        }
    });


    return master;


}




function parseItemizeScan(text){



    let scan={};



    let rows =
    text.split(/\r?\n/);





    rows.forEach(row=>{



        let col =
        row.split(",");





        if(col.length>=3){



            let rack =
            col[1]
            .trim();



            let sku =
            col[2]
            .trim();





            if(!sku)
            return;





            if(!scan[sku]){


                scan[sku]=[];


            }




            if(
            !scan[sku]
            .includes(rack)
            ){


                scan[sku]
                .push(rack);


            }




        }



    });





    return scan;


}









function prosesItemize(master,scan){



    let hasil=[];






    Object.keys(master)

    .forEach(sku=>{



        let item =
        master[sku];



        let rackArea="-";

        let display="-";

        let remark="Unscan";






        if(scan[sku]){



            remark="Scanned";



            rackArea =
            scan[sku]
            .join(", ");







            if(scan[sku].length>1){



                display =
                "Double Display";



            }

            else{


                if(
                scan[sku][0]
                ===
                item.rack
                ){


                    display =
                    "Single Display";


                }

                else{


                    display =
                    "Wrong Area";


                }


            }





        }







        hasil.push({


            sku:item.sku,


            rack:item.rack,


            desc:item.desc,


            rackArea:rackArea,


            display:display,


            remark:remark



        });






    });






    return hasil;



}









function tampilkanItemizeSummary(data){



    let total=data.length;


    let scanned=0;


    let unscan=0;


    let doubleDisplay=0;


    let wrongArea=0;







    data.forEach(row=>{



        if(row.remark==="Scanned")

        scanned++;




        if(row.remark==="Unscan")

        unscan++;





        if(row.display==="Double Display")

        doubleDisplay++;





        if(row.display==="Wrong Area")

        wrongArea++;




    });







    let html=`


<div class="summary">



<div class="card total">

<h3>${total}</h3>

<p>Total SKU</p>

</div>




<div class="card tally">

<h3>${scanned}</h3>

<p>Scanned</p>

</div>





<div class="card short">

<h3>${unscan}</h3>

<p>Unscan</p>

</div>





<div class="card extra">

<h3>${doubleDisplay}</h3>

<p>Double Display</p>

</div>





<div class="card wrongArea">

<h3>${wrongArea}</h3>

<p>Wrong Area</p>

</div>



</div>



`;





document
.getElementById("itemizeSummary")
.innerHTML=html;



}

/* =====================================================
   ITEMIZE RESULT TABLE
===================================================== */


function tampilkanItemizeResult(data){


    let html = `


<table>


<thead>

<tr>

<th>SKU</th>

<th>Rack Number</th>

<th>Description</th>

<th>Rack Area</th>

<th>Display</th>

<th>Remark</th>


</tr>

</thead>


<tbody>


`;




data.forEach(row=>{



    let cls="sama";



    if(row.remark==="Unscan"){


        cls="minus";


    }


    else if(row.display==="Double Display"){


        cls="plus";


    }


    else if(row.display==="Wrong Area"){


        cls="wrongArea";


    }






html += `



<tr class="${cls}">


<td>${row.sku}</td>


<td>${row.rack}</td>


<td>${row.desc}</td>


<td>${row.rackArea}</td>


<td>${row.display}</td>


<td>${row.remark}</td>



</tr>



`;



});





html+=`


</tbody>


</table>


`;





document
.getElementById("itemizeResult")
.innerHTML=html;



}









/* =====================================================
   DOWNLOAD ITEMIZE EXCEL
===================================================== */



function downloadItemizeExcel(){



    if(itemizeGlobal.length===0){


        alert(
        "Belum ada data Itemize"
        );


        return;


    }






let exportData =

itemizeGlobal.map(row=>({



    SKU:
    row.sku,



    Rack_Number:
    row.rack,



    Description:
    row.desc,



    Rack_Area:
    row.rackArea,



    Display:
    row.display,



    Remark:
    row.remark



}));







let ws =

XLSX.utils
.json_to_sheet(exportData);






ws["!cols"]=[


{wch:15},

{wch:15},

{wch:40},

{wch:25},

{wch:20},

{wch:15}



];







let wb =

XLSX.utils
.book_new();






XLSX.utils
.book_append_sheet(

wb,

ws,

"Itemize"


);







let now=new Date();





let filename =

"Itemize_"+

now.getFullYear()+"-"+

String(now.getMonth()+1)
.padStart(2,"0")+"-"+

String(now.getDate())
.padStart(2,"0")+

".xlsx";







XLSX.writeFile(

wb,

filename

);



}









/* =====================================================
   SAVE ITEMIZE TO GOOGLE SHEET
===================================================== */



function saveItemize(data){



const storeCode =

localStorage
.getItem("storeCode");





if(!storeCode){


alert(
"Session login hilang"
);


return;


}






fetch(
GAS_URL,
{

method:"POST",

headers:{


"Content-Type":
"application/json"


},


body:JSON.stringify({



action:
"saveItemizeBatch",



storeCode:
storeCode,



data:data



})


})




.then(res=>res.json())



.then(result=>{



console.log(
"SAVE ITEMIZE",
result
);



if(!result.success){


alert(
result.message
);


}



})



.catch(err=>{


console.error(err);


alert(
"Gagal simpan Itemize"
);


});



}









/* =====================================================
   LOAD ITEMIZE AFTER LOGIN
===================================================== */



function loadItemize(){



const storeCode =

localStorage
.getItem("storeCode");





if(!storeCode)
return;






fetch(

GAS_URL+

"?action=loadItemize&storeCode="+

encodeURIComponent(storeCode)


)



.then(res=>res.json())



.then(result=>{



console.log(
"LOAD ITEMIZE",
result
);






if(result.success){



itemizeGlobal =

result.data || [];






tampilkanItemizeSummary(

itemizeGlobal

);






tampilkanItemizeResult(

itemizeGlobal

);




}



})



.catch(err=>{


console.error(
err
);


});



}









/* =====================================================
   DELETE ITEMIZE DATABASE
===================================================== */



function deleteItemizeData(){



if(
!confirm(
"Hapus semua data Itemize?"
)
)
return;






fetch(

GAS_URL,

{


method:"POST",


headers:{


"Content-Type":
"application/json"


},


body:JSON.stringify({



action:
"deleteItemize",



storeCode:
localStorage.getItem("storeCode")



})


}

)






.then(res=>res.json())



.then(result=>{



console.log(
result
);






if(result.success){



itemizeGlobal=[];




document
.getElementById("itemizeSummary")
.innerHTML="";




document
.getElementById("itemizeResult")
.innerHTML="";




alert(
"Data Itemize berhasil dihapus"
);



}

else{


alert(
result.message
);


}




})



.catch(err=>{


console.error(err);


alert(
"Gagal hapus data"
);


});



}
