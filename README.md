nes-gg
------

Simple functions to encode / decode NES Game Genie codes.

## Usage:

### decode(gameGenieCode: string) -> { address, data, compare? }

Decode an NES Game Genie code into its components

### encode({ address: number, data: number, compare?: number }) -> string

Encode a cheat spec into a Game Genie code

## NES Game Genie info

NES Game Genie codes consist of a 15-bit address, an 8-bit data value,
and an optional 8-bit compare value.

The Game Genie interprets these as follows:

* The NES requests a byte from the ROM at address A
* If A matches one of the entered codes:
  * If there is no compare value, send back the data value
  * If there is a compare value:
    * read the cartridge at the requested address as D
    * If D is equal to the compare value, send back the data value
    * Otherwise, pass D through

The purpose of the compare value is to compensate for the presence of
various NES mappers; basically, it enables the Game Genie to be certain
that the right bank is selected for a given replacement.

You can read more about implementation on the [NesDEV wiki](https://www.nesdev.org/wiki/Game_Genie).

The way these codes are encoded is as follows:

* First, here's the specification for the code, in nibbles.  The structure I'm using is:

VarN <- Short name for the nibble; N is the position of the nibble in the var, so we can keep track  
IIII <- Which var a bit belongs to (A = Address, D = Data, C = Compare)  
\#### <- Bit number in the variable, in hex

```
Adr3 Adr2 Adr1 Adr0
-EDC BA98 7654 3210

Dat1 Dat0
7654 3210

Cmp1 Cmp0
7654 3210
```

* These nibbles are arranged into an array:

```
Dat1 Adr1 Adr3 Adr0 Adr2 Cmp0 Cmp1 Dat0
7654 7654 -EDC 3210 BA98 3210 7654 3210
```

* These are then convoluted, such that each nibble has the lower three bits of the previous, wrapping the list around:

```
DDDD ADDD HAAA AAAA AAAA CAAA CCCC DCCC
7210 7654 -654 3EDC B210 3A98 7210 3654
```

* Each nibble is then converted to a symbol for display, with the following mapping:

```
Hex 0123456789abcdef
GG  APZLGITYEOXUKSVN
```

The process is the same for 6- and 8-letter codes, with the only difference being that, if 
not present, the compare byte is not part of the initial arrangement.  This only really 
changes the location of bit 3 of the data byte.

```
Dat1 Adr1 Adr3 Adr0 Adr2 Dat0
7654 7654 -EDC 3210 BA98 3210
              
              |
             \ /

DDDD ADDD HAAA AAAA AAAA DAAA
7210 7654 -654 3EDC B210 3A98
```

To decode, you just do the whole process in reverse; that is

* the code is converted to nibbles, which we'll call the raw code:

```
VUTS RQPO NMLK JIHG FEDC BA98 7654 3210
````

* Deconvolute by giving each nibble the lower three bits of the _next_ nibble:

```
VQPO RMLK NIHG JEDC FA98 B654 7210 3UTS
````

* Then rearrange to get back our address, data, and compare values:

```
Adr3 Adr2 Adr1 Adr0
NIHG FA98 RMLK JEDC

Dat1 Dat0
VQPO 3UTS

Cmp1 Cmp0
7210 B654
````

* Again, this works the same for 6-letter codes:

```
NMLK JIHG FEDC BA98 7654 3210
              |
             \ /
NIHG JEDC FA98 B654 7210 3MLK
              |
             \ /
     Adr3 Adr2 Adr1 Adr0
     FA98 7210 JEDC B654

          Dat1 Dat0
          NIHG 3MLK
```