import turtle
import tkinter as tk
import math

root = tk.Tk()
canvas = tk.Canvas(master = root, width = 450, height = 450)
canvas.pack()
tu=turtle.RawTurtle(canvas)
tu.hideturtle()
tu.speed(0)
tu.pu()
ts=turtle.TurtleScreen(canvas)
ts.tracer(0,0)
lock=0
zoom=1

def polar():
    tu.pu()
    tu.color("black")
    tu.setx(0)
    tu.setheading(0)
    tu.sety(-50)
    tu.pd()
    tu.circle(50)
    tu.pu()
    tu.sety(-50)
    tu.pd()
    tu.circle(50)
    tu.pu()
    tu.sety(-100)
    tu.pd()
    tu.circle(100)
    tu.pu()
    tu.sety(-150)
    tu.pd()
    tu.circle(150)
    tu.pu()
    tu.sety(-200)
    tu.pd()
    tu.circle(200)
    tu.sety(200)
    tu.pu()
    tu.setx(-200)
    tu.sety(0)
    tu.pd()
    tu.setx(200)
    tu.pu()
    tu.setx(0)
    tu.sety(0)
    tu.seth(45)
    tu.fd(200)
    tu.seth(225)
    tu.pd()
    tu.fd(400)
    tu.pu()
    tu.setx(0)
    tu.sety(0)
    tu.seth(135)
    tu.fd(200)
    tu.seth(315)
    tu.pd()
    tu.fd(400)
    tu.pu()
    ts.update()

def yay():
    global lock
    if lock==1:return None
    ref['state']=tk.DISABLED
    do['state']=tk.DISABLED
    lock=1
    import random
    tu.pu()
    tu.setx(random.randint(-200,200))
    tu.sety(random.randint(-200,200))
    tu.pd()
    hue(rcomp.get(),gcomp.get(),bcomp.get())
    tu.circle(20)
    ts.update()
    lock=0
    ref['state']=tk.NORMAL
    do['state']=tk.NORMAL

def clear():
    global lock,zoom
    if lock==1:return None
    ref['state']=tk.DISABLED
    do['state']=tk.DISABLED
    lock=1
    tu.clear()
    polar()
    try:
        zoom=int(zoomlvl.get())
    except ValueError:pass
    lock=0
    ref['state']=tk.NORMAL
    do['state']=tk.NORMAL

def hue(r,g,b):
    try:
        r='0'+r
        g='0'+g
        b='0'+b
        r=int(r)
        g=int(g)
        b=int(b)
    except ValueError:
        lock=0
        return None
    if r>255:r=255
    if g>255:g=255
    if b>255:b=255
    if r<0:r=0
    if g<0:g=0
    if b<0:b=0
    s='0123456789abcdef'
    r=s[r//16]+s[r%16]
    g=s[g//16]+s[g%16]
    b=s[b//16]+s[b%16]
    tu.color('#'+r+g+b)

def plot():
    global lock,x,y
    if lock==1:return None
    lock=1
    ref['state']=tk.DISABLED
    do['state']=tk.DISABLED
    tu.pu()
    hue(rcomp.get(),gcomp.get(),bcomp.get())
    func=infunc.get()
    pstate=0
    for pos in range(-999,1000):
        x=math.tan(pos*math.pi/2000)
        try:
            exec('global y;y='+func)
            if type(y) not in [float,int,bool]:raise ValueError
        except Exception as e:
            print(e)
            if pstate==1:
                tu.pu()
                pstate=0
        else:
            if x*x+y*y==0:
                xt=0
                yt=0
            else:
                xt=math.atan((x*x+y*y)**.5/zoom)*x/(x*x+y*y)**.5*400/math.pi
                yt=math.atan((x*x+y*y)**.5/zoom)*y/(x*x+y*y)**.5*400/math.pi
            head=tu.goto(xt,yt)
            dist=tu.distance(xt,yt)
            if head!=None:
                tu.seth(head)
                tu.fd(dist)
            tu.setx(xt)
            tu.sety(yt)
            if pstate==0:
                tu.pd()
                pstate=1
    tu.pu()
    ts.update()
    lock=0
    ref['state']=tk.NORMAL
    do['state']=tk.NORMAL

polar()

rcomp=tk.StringVar()
gcomp=tk.StringVar()
bcomp=tk.StringVar()
infunc=tk.StringVar()
zoomlvl=tk.StringVar()
ref=tk.Button(master=root,text="Refocus",command=clear,state=tk.NORMAL)
ref.pack(side=tk.RIGHT)
tk.Entry(master=root,textvariable=zoomlvl,width=4).pack(side=tk.RIGHT)
tk.Label(master=root,text="  Zoom").pack(side=tk.RIGHT)
#tk.Button(master=root,text="Yay",command=yay).pack(side=tk.RIGHT)
tk.Entry(master=root,textvariable=bcomp,width=4).pack(side=tk.RIGHT)
tk.Label(master=root,text="B",foreground="blue").pack(side=tk.RIGHT)
tk.Entry(master=root,textvariable=gcomp,width=4).pack(side=tk.RIGHT)
tk.Label(master=root,text="G",foreground="green").pack(side=tk.RIGHT)
tk.Entry(master=root,textvariable=rcomp,width=4).pack(side=tk.RIGHT)
tk.Label(master=root,text="R",foreground="red").pack(side=tk.RIGHT)
tk.Label(master=root,text="y=").pack(side=tk.LEFT)
tk.Entry(master=root,textvariable=infunc).pack(side=tk.LEFT)
do=tk.Button(master=root,text="Plot",command=plot)
do.pack(side=tk.LEFT)


root.mainloop()
