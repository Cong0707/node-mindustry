const dgram=require("dgram");
const net=require("net");
const lz4=require("lz4");
const crc32=require("crc-32");
const {EventEmitter}=require("events");
const zlib=require("zlib");

const debug=false;

class ByteBuffer{
    #pos=0;
    #buf;
    #lim;
    constructor(length){
        this.#buf=Buffer.alloc(length);
        this.#lim=length
    }
    static allocate(length){
        return new this(length)
    }
    static from(buffer){
        let obj=new this(buffer.length);
        obj.put(buffer);
        obj.position(0);
        return obj
    }
    clear(){
        this.#pos=0;
        this.#lim=this.#buf.length;
        this.#buf.fill();
        return this
    }
    get(bytes){
        let o=this.#pos;
        this.#pos=o+(bytes?bytes:1);
        return bytes?this.#buf.slice(o,bytes+o):this.#buf.slice(o,o+1)[0]
    }
    getInt(){
        let o=this.#pos;
        this.#pos=o+4;
        return this.#buf.slice(o,o+4).readInt32BE()
    }
    limit(limit){
        if(limit!==undefined){
            this.#lim=limit;
            this.#pos=Math.min(this.#pos,limit);
            return this
        } else {
            return this.#lim
        }
    }
    remaining(){
        return this.#lim-this.#pos
    }
    getShort(){
        let o=this.#pos?this.#pos:0;
        this.#pos=o+2;
        return this.#buf.readInt16BE(o)
    }
    position(pos){
        if(pos!==undefined){
            this.#pos=pos;
            return this
        } else {
            return this.#pos
        }
    }
    flip(){
        this.#lim=this.#pos;
        this.#pos=0;
        return this
    }
    compact(){
        this.#buf.copy(this.#buf,0,this.#pos,this.#lim);
        this.#pos=this.#lim-this.#pos;
        this.#lim=this.#buf.length;
        return this
    }
    put(data){
        if(Buffer.isBuffer(data)){
            let writeBytes=Math.min(this.remaining(),data.length);
            data.copy(this.#buf,this.#pos,0,writeBytes);
            this.#pos+=writeBytes;
            return this
        } else if(typeof(data)=="string"){
            return this.put(Buffer.from(data))
        } else if(data instanceof Array){
            return this.put(Buffer.from(data))
        } else if(data instanceof ByteBuffer){
            data.flip();
            this.put(data._getBuffer());
            data.clear();
            return this
        } else {
            this.#buf[this.#pos]=data;
            this.#pos++;
            return this
        }
    }
    hasRemaining(){
        return this.remaining()!=0
    }
    capacity(){
        return this.#buf.length
    }
    putShort(data){
        this.#buf.writeInt16BE(data,this.#pos);
        this.#pos+=2;
        return this
    }
    array(){
        return this.#buf.toJSON().data
    }
    putInt(data){
        this.#buf.writeInt32BE(data,this.#pos);
        this.#pos+=4;
        return this
    }
    getInt(){
        let o=this.#pos?this.#pos:0;
        this.#pos=o+4;
        return this.#buf.readInt32BE(o)
    }
    toString(){
        return `ByteBuffer[pos=${this.#pos},lim=${this.#lim},cap=${this.#buf.length}]`
    }
    _getBuffer(offset){
        return this.#buf.slice(offset===undefined?0:offset,this.#lim)
    }
    putLong(data){
        this.#buf.writeInt32BE((data&0xffffffff00000000)>>32,this.#pos);
        this.#buf.writeInt32BE(data>>32,this.#pos+4);
        this.#pos+=8;
        return this
    }
    putFloat(data){
        this.#buf.writeFloatBE(data,this.#pos);
        this.#pos+=4;
        return this
    }
    getFloat(){
        let o=this.#pos?this.#pos:0;
        this.#pos=o+4;
        return this.#buf.readFloatBE(o)
    }
    getDouble(){
        let o=this.#pos?this.#pos:0;
        this.#pos=o+8;
        return this.#buf.readDoubleBE(o)
    }
    getLong(){
        let o=this.#pos?this.#pos:0;
        this.#pos=o+8;
        let value=this.#buf.readInt32BE(o)<<32;
        return value|this.#buf.readInt32BE(o+4)
    }
}

class DataStream extends ByteBuffer{
    readString(){
        return this.get(this.get(2).readUInt16BE()).toString()
    }
    writeString(buf){
        if(Buffer.isBuffer(buf)){
            this.putShort(buf.length);
            this.put(buf)
        } else {
            this.writeBuffer(Buffer.from(buf))
        }
    }
}

var Packets=new Map();

class Packet{
    read(){}
    write(){}
    handled(){}
    handleServer(){}
    handleClient(){}
    static newPacket(id){
        return Packets.get(id)?new (Packets.get(id))():null
    }
}

class TypeIO{
    static writeString(buf,string){
        if(string){
            buf.put(1);
            let strbuf=Buffer.from(string);
            buf.put(strbuf.length>>8);
            buf.put(strbuf.length&0xff);
            buf.put(strbuf)
        } else {
            buf.put(0)
        }
    }
    static readString(buf){
        let str=buf.get();
        if(str){
            return buf.get(buf.getShort()).toString()
        } else {
            return null
        }
    }
    static writeKick(buf,reason){
        buf.put(reason.id)
    }
    static readKick(buf){
        return KickReason[buf.get()]
    }
}

class KickReason{
    static kick=class extends KickReason{
        static id=0
    };
    static clientOutdated=class extends KickReason{
        static id=1
    };
    static serverOutdated=class extends KickReason{
        static id=2
    };
    static banned=class extends KickReason{
        static id=3
    };
    static gameover=class extends KickReason{
        static id=4
    };
    static recentKick=class extends KickReason{
        static id=5
    };
    static nameInUse=class extends KickReason{
        static id=6
    };
    static idInUse=class extends KickReason{
        static id=7
    };
    static nameEmpty=class extends KickReason{
        static id=8
    };
    static customClient=class extends KickReason{
        static id=9
    };
    static serverClose=class extends KickReason{
        static id=10
    };
    static vote=class extends KickReason{
        static id=11
    };
    static typeMismatch=class extends KickReason{
        static id=12
    };
    static whitelist=class extends KickReason{
        static id=13
    };
    static playerLimit=class extends KickReason{
        static id=14
    };
    static serverRestarting=class extends KickReason{
        static id=15
    }
}
{
    KickReason[0]=KickReason.kick;
    KickReason[1]=KickReason.clientOutdated;
    KickReason[2]=KickReason.serverOutdated;
    KickReason[3]=KickReason.banned;
    KickReason[4]=KickReason.gameover;
    KickReason[5]=KickReason.recentKick;
    KickReason[6]=KickReason.nameInUse;
    KickReason[7]=KickReason.idInUse;
    KickReason[8]=KickReason.nameEmpty;
    KickReason[9]=KickReason.customClient;
    KickReason[10]=KickReason.serverClose;
    KickReason[11]=KickReason.vote;
    KickReason[12]=KickReason.typeMismatch;
    KickReason[13]=KickReason.whitelist;
    KickReason[14]=KickReason.playerLimit;
    KickReason[15]=KickReason.serverRestarting
}

class StreamBegin extends Packet{
    _id=0;
    static #lastid=0;
    total;
    type;
    constructor(){
        super();
        this.id=StreamBegin.#lastid++
    }
    write(buf){
        buf.putInt(this.id);
        buf.putInt(this.total);
        buf.put(type)
    }
    read(buf){
        this.id=buf.getInt();
        this.total=buf.getInt();
        this.type=buf.get()
    }
}
Packets.set(0,StreamBegin);
class StreamChunk extends Packet{
    _id=1;
    id;
    data;
    write(buf){
        buf.putInt(this.id);
        buf.putShort(this.data.length);
        buffer.put(this.data)
    }
    read(buf){
        this.id=buf.getInt();
        this.data=buf.get(buf.getShort()).toJSON().data
    }
}
Packets.set(1,StreamChunk);
class WorldStream extends Packet{
    stream
}
Packets.set(2,WorldStream);
class ConnectPacket extends Packet{
    _id=3;
    name;
    usid;
    uuid;
    write(buf){
        buf.putInt(141);
        TypeIO.writeString(buf,"official");
        TypeIO.writeString(buf,this.name);
        TypeIO.writeString(buf,"Mars");
        TypeIO.writeString(buf,this.usid);
        let uuidbuf=Buffer.from(this.uuid,"base64").toJSON().data;
        buf.put(uuidbuf);
        buf.putLong(crc32.buf(uuidbuf));
        buf.put(0);
        buf.put([0xff,0xa1,0x08,0xff]);
        buf.put(0)
    }
}
Packets.set(3,ConnectPacket);
class BeginBreakCallPacket extends Packet{
    _id=9;
    write(buf){
        //TODO
    }
    read(buf){
        //TODO
        buf.get();
        buf.getInt();
        buf.get();
        buf.getInt();
        buf.getInt()
    }
}
Packets.set(9,BeginBreakCallPacket);
class ClientSnapshotCallPacket extends Packet{
    _id=19;
    snapshotID;
    write(buf){
        //TODO
        buf.putInt(this.snapshotID);
        buf.putInt(-1);
        buf.put(1);
        for(let i=0;i<8;i++){
            buf.putFloat(0)
        }
        buf.putInt(-1);
        for(let i=0;i<4;i++){
            buf.put(0)
        }
        buf.putInt(-1);
        buf.putFloat(0);
        buf.putFloat(0);
        buf.putFloat(1920);
        buf.putFloat(1080)
    }
}
Packets.set(19,ClientSnapshotCallPacket);
class ConnectConfirmCallPacket extends Packet{
    _id=23
}
Packets.set(23,ConnectConfirmCallPacket);
class DeconstructFinishCallPacket extends Packet{
    _id=29;
    write(buf){
        //TODO
    }
    read(buf){
        //TODO
        buf.getInt();
        buf.getShort();
        buf.get();
        buf.getInt()
    }
}
Packets.set(29,DeconstructFinishCallPacket);
class KickCallPacket extends Packet{
    _id=43;
    reason;
    write(buf){
        TypeIO.writeString(buf,this.reason)
    }
    read(buf){
        this.reason=TypeIO.readString(buf)
    }
}
Packets.set(43,KickCallPacket);
class KickCallPacket2 extends Packet{
    _id=44;
    reason;
    write(buf){
        TypeIO.writeKick(buf,reason)
    }
    read(buf){
        this.reason=TypeIO.readKick(buf)
    }
    handled(){
        console.log(this.reason)
    }
}
Packets.set(44,KickCallPacket2);
class PingCallPacket extends Packet{
    _id=54;
    time;
    write(buf){
        buf.putLong(this.time)
    }
}
Packets.set(54,PingCallPacket);
class SendChatMessageCallPacket extends Packet{
    _id=69;
    message;
    write(buf){
        TypeIO.writeString(buf,this.message)
    }
    read(){
        //TODO
    }
}
Packets.set(69,SendChatMessageCallPacket);
class SendMessageCallPacket2 extends Packet{
    _id=71;
    message;
    unformatted;
    playersender;
    write(buf){
        //TODO
    }
    read(buf){
        this.message=TypeIO.readString(buf);
        this.unformatted=TypeIO.readString(buf);
        this.playersender=buf.getInt()
    }
    handled(){
        console.log(this.message)
    }
}
Packets.set(71,SendMessageCallPacket2);
class TransferItemToCallPacket extends Packet{
    _id=98;
    write(buf){
        //TODO
    }
    read(buf){
        //TODO
        buf.get();
        buf.getInt();
        buf.getShort();
        buf.getInt();
        buf.getFloat();
        buf.getFloat();
        buf.getInt()
    }
}
Packets.set(98,TransferItemToCallPacket);
class UnitControlCallPacket extends Packet{
    _id=104;
    player;
    unit;
    write(buf){
        //TODO
    }
    read(buf){
        //TODO
    }
}
Packets.set(104,UnitControlCallPacket);

class TCPConnection{
    #maxLength;
    #readBuffer;
    #writeBuffer;
    #serializer;
    #tcp;
    #connected;
    #timer;
    #objectLength;
    constructor(w,r,s,p){
        this.#writeBuffer=ByteBuffer.allocate(w);
        this.#serializer=s;
        this.#tcp=new net.Socket();
        this.#tcp.setNoDelay(true);
        this.#connected=false;
        this.#tcp.on("connect",()=>{
            this.#timer=setInterval(()=>{
                this.send(new FrameworkMessage.KeepAlive())
            },8000)
        });
        this.#tcp.on("data",d=>{
            let res=this.readObject(d);
            p(res);
            while(res){
                res=this.readObject();
                p(res)
            }
        });
        this.#tcp.on("close",()=>{
            clearInterval(this.#timer)
        })
    }
    on(name,func){
        this.#tcp.on(name,func)
    }
    connect(port,ip){
        if(!this.#connected){
            this.#readBuffer=Buffer.alloc(0);
            this.#objectLength=0;
            this.#tcp.setTimeout(12000);
            this.#tcp.connect(port,ip);
            this.#tcp.ref();
            this.#connected=true
        } else {
            console.error("TCP already connected!")
        }
    }
    close(){
        if(this.#connected){
            this.#connected=false;
            this.#tcp.end();
            this.#tcp.unref()
        }
    }
    readObject(d){
        try{
            if(d){
                if(this.#objectLength==0){
                    this.#objectLength=d.readInt16BE(0)
                }
                if((this.#readBuffer=Buffer.concat([this.#readBuffer,d])).length<this.#objectLength){
                    return null
                }
            } else {
                if(this.#objectLength==0&&this.#readBuffer.length>=2){
                    this.#objectLength=this.#readBuffer.readInt16BE(0)
                }
                if(this.#readBuffer.length<this.#objectLength){
                    return null
                }
            }
            if(this.#objectLength!=0){
                let buf=ByteBuffer.from(this.#readBuffer).position(2);
                let length=this.#objectLength;
                this.#readBuffer=this.#readBuffer.slice(length+2);
                this.#objectLength=0;
                if(buf.remaining()>this.#maxLength){
                    console.error(`Packet too large!(${buf.capacity()} bytes)`);
                    return null
                }
                if(length<0){
                    return null
                }
                if(buf.remaining()<length){
                    buf.position(buf.capacity());
                    return null
                }
                buf.limit(length+2);
                let obj=this.#serializer.read(buf);
                if(buf.position()-2<length){
                    if(debug){
                        console.error(`Broken TCP ${obj?obj.constructor.name+" ":""}packet!remaining ${length+2-buf.position()} bytes`)
                    }
                    buf.position(length+2);
                    buf.limit(buf.capacity());
                    return null
                }
                return obj
            } else {
                return null
            }
        }catch(e){
            this.#objectLength=0;
            this.#readBuffer=Buffer.alloc(0);
            return null
        }
    }
    send(object){
        this.#writeBuffer.clear();
        this.#writeBuffer.position(2);
        this.#serializer.write(this.#writeBuffer,object);
        let length=this.#writeBuffer.position()-2;
        this.#writeBuffer.position(0);
        this.#writeBuffer.putShort(length);
        this.#writeBuffer.position(length+2);
        this.#writeBuffer.flip();
        this.#tcp.write(this.#writeBuffer._getBuffer());
        return length+2
    }
}

class UDPConnection{
    #maxLength;
    #writeBuffer;
    #serializer;
    #udp;
    #connected;
    #timer;
    constructor(w,r,s,p){
        this.#writeBuffer=ByteBuffer.allocate(w);
        this.#maxLength=r;
        this.#serializer=s;
        this.#connected=false;
        this.#udp=dgram.createSocket("udp4",d=>{
            p(this.readObject(d))
        })
    }
    on(name,func){
        this.#udp.on(name,func)
    }
    connect(port,ip){
        if(!this.#connected){
            this.#writeBuffer.clear();
            this.#udp.connect(port,ip);
            this.#udp.ref();
            this.#connected=true;
            this.#timer=setInterval(()=>{
                this.send(new FrameworkMessage.KeepAlive())
            },19000)
        } else {
            console.error("UDP already connected!")
        }
    }
    close(){
        if(this.#connected){
            this.#connected=false;
            this.#udp.disconnect();
            this.#udp.unref();
            clearInterval(this.#timer)
        }
    }
    readObject(d){
        if(d.length>this.#maxLength){
            console.error(`Packet too large!(${d.length} bytes)`);
            return null
        }
        let buf=ByteBuffer.from(d);
        let obj=this.#serializer.read(buf);
        if(buf.hasRemaining()){
            if(debug){
                console.error(`Broken UDP ${obj?obj.constructor.name+" ":""}packet!remaining ${buf.remaining()} bytes`)
            }
            return null
        }
        return obj
    }
    send(object){
        this.#writeBuffer.clear();
        this.#serializer.write(this.#writeBuffer,object);
        this.#writeBuffer.flip();
        let length=this.#writeBuffer.limit();
        this.#udp.send(this.#writeBuffer._getBuffer());
        return length
    }
}

class FrameworkMessage{
    static RegisterTCP=class extends FrameworkMessage{
        connectionID
    }
    static RegisterUDP=class extends FrameworkMessage{
        connectionID
    }
    static KeepAlive=class extends FrameworkMessage{}
}

class Client{
    #TCPRegistered=false;
    #UDPRegistered=false;
    #tcp;
    #udp;
    #event;
    #parser;
    constructor(w,r,s,p){
        this.#tcp=new TCPConnection(w,r,s,data=>{this.parse(data)});
        this.#udp=new UDPConnection(w,r,s,data=>{this.parse(data)});
        this.#event=new EventEmitter();
        this.#tcp.on("timeout",()=>{
            this.#event.emit("timeout")
        });
        this.#tcp.on("error",e=>{
            this.#event.emit("error",e)
        });
        this.#tcp.on("close",()=>{
            this.#event.emit("disconnect")
        });
        this.#parser=p
    }
    on(name,func){
        this.#event.on(name,func)
    }
    once(name,func){
        this.#event.once(name,func)
    }
    connect(port,ip){
        this.#tcp.connect(port,ip);
        this.#udp.connect(port,ip);
        setTimeout(()=>{
            if(!this.#UDPRegistered){
                this.close()
            }
        },10000)
    }
    sendTCP(obj){
        return this.#tcp.send(obj)
    }
    sendUDP(obj){
        return this.#udp.send(obj)
    }
    close(){
        this.#tcp.close();
        this.#udp.close();
        this.#TCPRegistered=false;
        this.#UDPRegistered=false
    }
    parse(packet){
        if(packet){
            if(!this.#TCPRegistered){
                if(packet instanceof FrameworkMessage.RegisterTCP){
                    this.#TCPRegistered=true;
                    let p=new FrameworkMessage.RegisterUDP();
                    p.connectionID=packet.connectionID;
                    this.sendUDP(p)
                }
            }
            if(!this.#UDPRegistered){
                if(packet instanceof FrameworkMessage.RegisterUDP){
                    this.#UDPRegistered=true;
                    this.#event.emit("connect")
                }
            }
            if(!(packet instanceof FrameworkMessage)){
                this.#parser(packet)
            }
        }
    }
}

class PacketSerializer{
    #temp;
    constructor(){
        this.#temp=ByteBuffer.allocate(32768)
    }
    read(buf){
        let id=buf.get();
        if(id==254){
            return this.readFramework(buf)
        } else {
            if(Packets.get(id)){
                let packet=new (Packets.get(id))();
                let length=buf.getShort();
                let compressed=buf.get();
                this.#temp.clear();
                if(compressed){
                    let size=buf.remaining();
                    lz4.decodeBlock(buf._getBuffer(buf.position()),this.#temp._getBuffer());
                    this.#temp.position(0);
                    this.#temp.limit(length);
                    packet.read(this.#temp,length);
                    buf.position(buf.position()+size)
                } else {
                    this.#temp.position(0).limit(length);
                    this.#temp.put(buf._getBuffer(buf.position()));
                    this.#temp.position(0);
                    packet.read(this.#temp,length);
                    buf.position(buf.position()+this.#temp.position())
                }
                return packet
            } else if(debug){
                console.error("Unknown packet id:"+id)
            }
            buf.clear();
        }
    }
    write(buf,object){
        if(Buffer.isBuffer(object)||(object instanceof ByteBuffer)){
            buf.put(object)
        } else if(object instanceof FrameworkMessage){
            buf.put(-2);
            this.writeFramework(buf,object)
        } else if(object instanceof Packet){
            buf.put(object._id);
            this.#temp.clear();
            object.write(this.#temp);
            let length=this.#temp.position();
            buf.putShort(length);
            if(length<36||object instanceof StreamChunk){
                buf.put(0);
                buf.put(this.#temp)
            } else {
                buf.put(1);
                this.#temp.flip();
                let size=lz4.encodeBlock(this.#temp._getBuffer(),buf._getBuffer(buf.position()));
                buf.position(buf.position()+size)
            }
        } else {
            console.error("Invaild type:"+object.toString())
        }
    }
    writeLength(buf,len){
        buf.putShort(len)
    }
    writeFramework(buf,msg){
        if(msg instanceof FrameworkMessage.KeepAlive){
            buf.put(2)
        } else if(msg instanceof FrameworkMessage.RegisterUDP){
            buf.put(3);
            buf.putInt(msg.connectionID)
        } else if(msg instanceof FrameworkMessage.RegisterTCP) {
            buf.put(4);
            buf.putInt(msg.connectionID)
        }
    }
    readFramework(buf){
        let id=buf.get();
        if(id==0){
            
        } else if(id==1){
            
        } else if(id==2){
            return new FrameworkMessage.KeepAlive()
        } else if(id==3){
            let p=new FrameworkMessage.RegisterUDP();
            p.connectionID=buf.getInt();
            return p
        } else if(id==4){
            let p=new FrameworkMessage.RegisterTCP();
            p.connectionID=buf.getInt();
            return p
        } else {
            console.error("Unknown FrameworkMessage!")
        }
    }
}

class StreamBuilder{
    id;
    type;
    total;
    stream;
    constructor(packet){
        this.id=packet.id;
        this.type=packet.type;
        this.total=packet.total;
        this.stream=ByteBuffer.allocate(this.total)
    }
    add(data){
        this.stream.put(data)
    }
    isDone(){
        return this.stream.position()>=this.total
    }
    build(){
        let s=Packet.newPacket(this.type);
        s.stream=this.stream.position(0);
        return s
    }
}

class NetClient{
    #client;
    #event;
    #streams;
    constructor(){
        this.#client=new Client(8192,32768,new PacketSerializer(),p=>{this.handleClientReceived(p)});
        this.#event=new EventEmitter();
        this.#client.on("timeout",()=>{
            console.log("timeout!");
            this.reset();
            this.#event.emit("timeout")
        });
        this.#client.on("error",e=>{
            this.reset();
            console.error(e.stack);
            this.#event.emit("error")
        });
        this.#client.on("connect",()=>{
            console.log("connected!");
            this.#event.emit("connect")
        });
        this.#client.on("disconnect",()=>{
            console.log("disconnected!");
            this.reset();
            this.#event.emit("disconnect")
        });
        this.#streams=new Map()
    }
    on(name,func){
        this.#event.on(name,func)
    }
    once(name,func){
        this.#event.once(name,func)
    }
    connect(port,ip){
        this.#client.connect(port,ip)
    }
    send(packet,reliabale){
        if(reliabale){
            this.#client.sendTCP(packet)
        } else {
            this.#client.sendUDP(packet)
        }
    }
    reset(){
        this.#client.close()
    }
    join(name,uuid){
        let p=new ConnectPacket();
        p.name=name;
        p.uuid=uuid;
        p.usid="AAAAAAAAAAA=";
        this.send(p,true)
    }
    sendChatMessage(msg){
        let p=new SendChatMessageCallPacket();
        p.message=msg;
        this.send(p,true)
    }
    connectConfirm(){
        this.send(new ConnectConfirmCallPacket(),true)
    }
    handleClientReceived(packet){
        try{
            packet.handled();
            if(packet instanceof StreamBegin){
                this.#streams.set(packet.id,new StreamBuilder(packet));
            } else if(packet instanceof StreamChunk){
                let builder=this.#streams.get(packet.id);
                if(builder){
                    builder.add(packet.data);
                    if(builder.isDone()){
                        console.log(`Received world data: ${builder.total} bytes.`);
                        this.#streams.delete(builder.id);
                        this.handleClientReceived(builder.build())
                    }
                } else {
                    console.error("Received stream chunk without a StreamBegin beforehand!")
                }
            } else {
                if(this.#event.listenerCount(packet.constructor.name)!=0){
                    this.#event.emit(packet.constructor.name,packet)
                } else {
                    packet.handleClient()
                }
            }
        }catch(e){
            this.reset();
            console.error(e.stack);
            this.#event.emit("error")
        }
    }
}

var pingHost=(ip,port,callback)=>{
    let client=dgram.createSocket("udp4",(msg,info)=>{
        client.disconnect();
        client.unref();
        let readString=buf=>{
            return buf.get(buf.get()).toString()
        }
        let bbuf=ByteBuffer.from(msg);
        callback({
            name:readString(bbuf),
            map:readString(bbuf),
            players:bbuf.getInt(),
            wave:bbuf.getInt(),
            version:bbuf.getInt(),
            vertype:readString(bbuf),
            gamemode:bbuf.get(),
            limit:bbuf.getInt(),
            description:readString(bbuf),
            modeName:readString(bbuf),
            ip:info.address,
            port:info.port
        })
    });
    client.on("connect",()=>{
        client.send(Buffer.from([-2,1]))
    });
    client.on('error',e=>{
        callback(null,e)
    });
    client.connect(port,ip);
    setTimeout(()=>{
        if(client.connectState==2){
            client.disconnect();
            client.unref();
            callback(null,new Error("Timed out"))
        }
    },2000)
}
/*
class Tile

class Tiles{
    width;
    height;
    array;
    constructor(width,height){
        this.width=width;
        this.height=height;
        this.array=new Array(width*height)
    }
}*/

module.exports={
    pingHost:pingHost,
    NetClient:NetClient
}