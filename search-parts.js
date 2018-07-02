console.log('hello from npm link')
/*eslint semi:off*/
function toStringLiteral(s){
  return "'" + s.replace(/'/g, "''") + "'"
}
function likeOrEqual(before, s, after){
  if(!before && !after){
    return ' = ' + toStringLiteral(s)
  }
  return 'like ' + toStringLiteral( (before ? '%' : '') + s + (after ? '%' : ''))
}
let moment = require('moment')
function noop(){}

let Search = {
  props:{
    def:null,
    field:{
      type:[String, Array],
      required:true
    },
    like:Boolean,
    beforeLike:Boolean,
    caption:String,
    label:Boolean,
    onchange:{
      type:Function,
      default:noop
    },
    convert:Function
  },
  created(){
    this.clear()
  },
  data(){
    return {
      value:''
    }
  },
  computed:{
    placeholder(){
      return this.label ? '' : this.caption
    }
  },
  methods:{
    change(){
      this.onchange(this.value)
    },
    clear(){
      this.value =  this.def || ''
      this.onchange()
    }
  }
}
let TextSearch = {
  mixins:[Search],
  props:{
    complex:String
  },
  template:'<div class="v-searcher">' +
    '<label v-if="label" class="v-search-label">{{caption}}</label>' +
    '<input type="text" class="text-search" :placeholder="placeholder" v-model="value" @change="change">' +
  '</div>',
  methods:{
    getCondition(){
      let v = this.value
      if(!v){
        return null
      }
      if(this.complex){
        let [firstField] = this.field
        return createComplex(this.complex, firstField, this.value)
      }
      return this.field.map((field)=>{
        return `${field} ${likeOrEqual(this.beforeLike, v, this.like)}`
      }).join(' OR ')
    }
  }
}
let MultiTextSearch = {
  mixins:[Search],
  template:'<div class="v-searcher">' +
    '<label v-if="label" class="v-search-label">{{caption}}</label>' +
    '<textarea class="mutil-text-search" v-model="value" :placeholder="placeholder" @change="change"></textarea>' +
  '</div>',
  methods:{
    getCondition(){
      let v = this.value
      if(!v){
        return null
      }
      let splitValue = v.split(/\r?\n/).map(v=>v.trim()).filter(Boolean)
      if(!splitValue.length){
        return null
      }
      return this.field.map((field)=>{
        return `${field} IN(${splitValue.map(toStringLiteral).join(',')})`
      }).join(' OR ')
    }
  }
}
const DATEFORMAT = 'YYYY-MM-DD'
let DateSearch = {
  data(){
    return {
      value:{
        from:'',
        to:''
      }
    }
  },
  mixins:[Search],
  template:'<div class="v-searcher">' +
    '<label v-if="label" class="v-search-label">{{caption}}</label>' +
    '<input class="date-search" :placeholder="placeholder +\' from\'" @change="onchangeDate" @click="set(\'from\')" @wheel="wheelMove(\'from\', $event)" @keydown="keyMove(\'from\', $event)" v-model="value.from" type="text">' + 
    '<input  class="date-search" placeholder="to" @click="set(\'to\')" @change="onchangeDate" @wheel="wheelMove(\'to\', $event)" @keydown="keyMove(\'to\' ,$event)" v-model="value.to" type="text">' +
  '</div>',
  methods:{
    onchangeDate(){
      this.onchange(this.value.from, this.value.to)
    },
    clear(){
      this.value.from = 
      this.value.to = ''
      this.onchangeDate()
    },
    set(tg){
      if(this.value[tg]){
        return
      }
      this.value[tg] = moment().format(DATEFORMAT)
      this.onchangeDate()
    },
    keyMove(tg, ev){
      let {which} = ev
      if(which === 46 || which === 8){/*delete or backspace*/
        return this.value[tg] = ''
      }
      if(which !== 40  && which !== 38){
        return
      }
      let v = this.value[tg]
      if(!v){
        return this.set(tg)
      }
      let move = which - 39/*middle*/
      this.value[tg] = moment(v, DATEFORMAT).add(move, 'day').format(DATEFORMAT)
      this.onchangeDate()
    },
    wheelMove(tg, ev){
      let v = this.value[tg]
      if(!v){
        return this.set(tg)
      }
      let move = ev.deltaY < 0 ? -1 : 1
      this.value[tg] = moment(v, DATEFORMAT).add(move, 'day').format(DATEFORMAT)
      this.onchangeDate()
    },
    getCondition(){
      let {value:{to,from}} = this
      if(!from && !to){
        return
      }
      if(!from){
        from = to
      }
      if(!to){
        to = from
      }
      to = moment(to,DATEFORMAT).add(1, 'day').format(DATEFORMAT)
      if(this.convert){
        const obj = this.convert(from, to)
        from = obj.from
        to = obj.to
      }
      return this.field.map(field=>{
        return `'${from}' <= ${field} AND ${field} <  '${to}'`
      }).join(' OR ')
    }
  }
}
let SelectSearch = {
  mixins:[Search],
  props:{
    list:{
      type:Array,
      required:true
    },
    complex:String,
    like:Boolean,
    beforeLike:Boolean,
    def:[Number, Object],
    unselectLabel:{
      type:String,
      default:'-'
    }
  },
  template:'<div class="v-searcher">' +
    '<label v-if="label" class="v-search-label">{{caption}}</label>' +
    '<select class="v-search-select" v-model="value" @change="change">' +
    '<option :value="defaultObj">{{placeholder}}</option>' +
    '<option v-for="item in list" :value="item">{{item.caption}}</option>' +
    '</select>' +
  '</div>',
  data(){
    return {
      defaultObj:{value:''}
    }
  },
  watch:{
    list(){
      this.value = this.defaultObj
    }
  },
  computed:{
    placeholder(){
      return this.label ? this.unselectLabel : this.caption
    }
  },
  methods:{
    clear(){
      if(typeof this.def === 'number'){
        this.value = this.list[this.def] || this.defaultObj
        return this.onchange()
      }
      this.value = this.def || this.defaultObj
      this.onchange()
    },
    getCondition(){
      let v = this.value.value
      if(!v){
        return null
      }
      if(this.complex){
        return createComplex(this.complex, this.field, this.value.value)
      }
      return this.field.map(field=>{
        return `${field} ${likeOrEqual(this.beforeLike, v, this.like)}`
      }).join(' OR ')
    }
  }
}
let MultiSelectSearch = {
  mixins:[Search],
  props:{
    list:{
      type:Array,
      required:true,
    },
    def:Array,
    size:{
      type:Number,
      default:3
    }
  },
  template:'<div class="v-searcher" @change="change">' +
    '<label v-if="label" class="v-search-label">{{caption}}</label>' + 
    '<select class="v-search-multi-select" v-model="value" multiple :size="size" @change="change">' +
    '<option v-if="!label" :value="defaultArray">{{caption}}</option>' +
    '<option v-for="item in list" :value="item">{{item.caption}}</option>' +
    '</select>' +
  '</div>',
  data(){
    return {
      defaultArray:[{value:''}]
    }
  },
  watch:{
    list(){
      this.value = this.defaultObj
    }
  },
  methods:{
    clear(){
      let defArray = this.def || this.defaultArray
      this.value = defArray.map(v=>{
        if(typeof v === 'number'){
          return this.list[v] || null
        }
        return v
      }).filter(Boolean)
      this.onchange()
    },
    getCondition(){
      let v = this.value.filter(v=>v.value)
      if(!v.length){
        return null
      }
      return this.field.map(field=>{
        return `${field} in(${v.map(el=>toStringLiteral(el.value)).join(',')})`
      }).join(' OR ')
      
    }
  }
}
let NullOrNotSearch = {
  mixins:[Search],
  props:{
    unselectLabel:{
      type:String,
      default:'-'
    },
    nullcaption:{
      type:String,
      default:'Null'
    },
    notnullcaption:{
      type:String,
      default:'Not Null'
    }
  },
  template:'<div class="v-searcher">' +
    '<label v-if="label" class="v-search-label">{{caption}}</label>' +
    '<select class="v-search-null-or-not" v-model="value" @change="change">' +
    '<option :value="defaultStr">{{placeholder}}</option>' +
    '<option value="null">{{nullcaption}}</option>' +
    '<option value="not null">{{notnullcaption}}</option>' +
    '</select>' +
  '</div>',
  data(){
    return {
      defaultStr:''
    }
  },
  computed:{
    placeholder(){
      return this.label ? this.unselectLabel : this.caption
    }
  },
  methods:{
    getCondition(){
      let v = this.value
      if(!v){
        return null
      }
      return (v === 'null') ? `${this.field} is NULL OR ${this.field} = ''` : `${this.field} <> ''`;
    }
  }
}

module.exports = {
  template:[
    '<span>',
    '<component v-for="(s, ind) in searches" ref="el" ',
    ':is="s.type+\'-search\'" ' ,
    ':field="fields(s.field)" :list="s.list" :def="s.def" :like="s.like" ',
    ':beforeLike="s.beforeLike" ',
    ':multi="s.multi" ',
    ':size="s.size" ',
    ':caption="s.caption" :complex="s.complex" ',
    ':label="s.label" ',
    ':unselectLabel="s.unselectLabel" ',
    ':key="ind" ',
    ':nullcaption="s.nullcaption" ',
    ':notnullcaption="s.notnullcaption" ',
    ':convert="s.convert" ',
    ':onchange="s.onchange"></component>',
    '</span>'
  ].join('')
  ,
  props:{
    searches:Array
  },
  components:{
    'text-search':TextSearch,
    'multi-text-search':MultiTextSearch,
    'date-search':DateSearch,
    'select-search':SelectSearch,
    'multi-select-search':MultiSelectSearch,
    'null-or-not-search':NullOrNotSearch
  },
  watch:{
    value(v){
      this.$emit('input',v)
    }
  },
  methods:{
    fields(f){
      if(f.constructor === String){
        return [f]
      }
      return f
    },
    getCondition(){
      let condition =  this.$refs.el.map(e=>e.getCondition()).filter(Boolean)
      if(condition.length){
        return '(' + condition.join(') AND (') + ')'
      }
      return null
    },
    clear(){
      this.$refs.el.forEach(e=>e.clear())
    }
  }
}

function createComplex(complex, field, value){
  return complex.replace(/\$\{field\}/g, field).replace(/\$\{value\}/g, value)
}