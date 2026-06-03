import { useState, useEffect } from "react";

export default function PracticePage(){
    //    const [p1, stP1]=useState
    const handleClick = ()=>{
    alert('the card is clicked')
}
    
    return (
        <div className="w-full bg-black  overflow-auto">
             <h1 className=" uppercase text-2xl text-center font-bold font-sans p-4 ">Dealing with the  styling</h1>
            <div className="w-full h-48 grid lg:grid-cols-4 gap-4 justify-center sm:grid-cols-1  md:grid-cols-2 ">
                
                <div className="bg-white text-black rounded-lg h-full">
                    <div className="bg-green-300 pt-1 mt-0"> division1 rbdrhdjrkbdrhdjkrbdjrhdbrdhj</div>
                    <div className=" bg-green-950 pt-2 mt-2">hhhddjdbjdjkrdrbjrk</div>
                    <div className="bg-green-600 pb-0 mt-2">hhhddjdbjdjkrdrbjrk</div>
                </div>
                <div className="bg-red-700 rounded-lg hover:bg-red-400"
                onClick={handleClick}> division1</div>
                <div className="bg-amber-300 rounded-lg"> division1</div>
                <div className="bg-teal-500 rounded-lg"> division1</div>
            </div>
 
             
        </div>

    );



}