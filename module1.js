class ImageUtils {
    static getCanvas(w, h){
        var c = document.querySelector("canvas");
        c.width = w;
        c.height = h;
        return c;
    }

    static getPixels(img){
        var c = ImageUtils.getCanvas(img.width, img.height);
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0,0,c.width,c.height);
    }

    static getPixelObjects(img){
        var pixelData=ImageUtils.getPixels(img),row=0,column=0
        console.log(pixelData.data.length/4,512*348);
        var pixelObjects=[[]];
        for(var i=0;i<pixelData.data.length/4;i++) {
            pixelObjects[row].push(new Pixel(pixelData.data[i*4], pixelData.data[i*4 + 1], pixelData.data[i*4 + 2], pixelData.data[i*4 + 3]));
            //console.log(i);
            if (pixelObjects[row].length>=pixelData.width){
                row++;
                if(row!=pixelData.height)
                    pixelObjects.push([]);
            }
        }
        return {
            objectData:pixelObjects,
            width:pixelData.width,
            height:pixelData.height,
            data:pixelData.data
        };
    }

    static putPixels(pixelData, w, h) {
        var imageData=new ImageData(pixelData,w,h);
        var c = ImageUtils.getCanvas(w, h);
        var ctx = c.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
    }

}

class Pixel{
    constructor(r,g,b,a){
        this.r=r;
        this.b=b;
        this.g=g;
        this.a=a;
        this.calc_mag();
    }
    calc_mag(){ this.magnitude=((this.r/255)+(this.g/255)+(this.b/255)+(this.a/255))/4; }
    add(pix){
        this.r=Math.min(255,this.r+pix.r);
        this.g=Math.min(255,this.g+pix.g);
        this.b=Math.min(255,this.b+pix.b);
        this.a=Math.min(255,this.a+pix.a);
        this.calc_mag();
        return this;
    }
    val(){
        return [this.r,this.g,this.b,this.a];
    }
    static Black(){
        return new Pixel(0,0,0,255);
    }
}

function pixelObjectsToImageData(pixelObjects){
    return {
        width:pixelObjects.width,
        height:pixelObjects.height,
        data:pixelObjects.data
    };
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// function definitions here

function createMask(imageData,maskFunc){
    var mask=[[]];
    for(var i=0;i<imageData.objectData.length;i++){
        for(var j=0;j<imageData.objectData[i].length;j++){
            mask[i].push(maskFunc(imageData.objectData[i][j]));
        }
        mask.push([]);
    }
    return mask;
}

function multiplyPixel(pix,mag){
    return new Pixel(pix.r*mag,pix.g*mag,pix.b*mag,pix.a*mag);
}

function applyMask(imageData,mask,pixelModFunc){
    var newImageData=imageData.objectData.slice();
    for(var i=0;i<imageData.objectData.length;i++) {
        for (var j = 0; j < imageData.objectData[i].length; j++) {
            var pixMod=pixelModFunc(imageData.objectData[i][j],i,j,imageData);
            if (pixMod[1]==1&&mask[i][j]>0.5) {
                newImageData[i][j] = pixMod[0];
                //console.log("Setting instaed of mixing");
            }else
                newImageData[i][j].add(multiplyPixel(pixMod[0],mask[i][j]));
        }
    }
    return applyPixelObjectChanges(newImageData);
}

function applyPixelObjectChanges(imageData){
    imageData.data=new Uint8ClampedArray(imageData.width*imageData.height*4);
    var offset=0;
    for(var i=0;i<imageData.objectData.length;i++){
        for(var j=0;j<imageData.objectData[i].length;j++){
            var pix=imageData.objectData[i][j];
            imageData.data.set(pix.val(),offset);
            offset+=4;
        }
    }
    return imageData;
}
function roadkill(pix,y,x,imageData)
{
    var new_x=(imageData.width-x-1);
    var new_pix=imageData.objectData[y][new_x];
    return [new_pix,1];
}
$(document).ready(function() {
    var img = new Image();
    img.src = "img/cat.jpg";
    var pixels = ImageUtils.getPixelObjects(img);
    var mask=createMask(pixels,function(pix){
        if(pix.magnitude>0.95)
            return 0.0;
        return 1.0;
    });
    pixels=applyMask(pixels,mask,roadkill);

    //pixels=applyMask(pixels,mask,function(pix,x,y,imageData){
    //    var new_x=(imageData.width-x-1);
    //    console.log(new_x);
    //    var new_pix=imageData.objectData[Math.min(348,y)][new_x];
    //    return [new_pix,1];
    //});

    ImageUtils.putPixels(pixels.data, img.width, img.height);
});