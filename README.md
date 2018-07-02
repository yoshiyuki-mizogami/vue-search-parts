vue-search-parts
===============
溝上のgithubに上げました  
[Github vue-search-parts](https://github.com/yoshiyuki-mizogami/vue-search-parts)  
使い方同じです
vue + electron + sql-q search component
## インストール
```sh
npm i git+http://10.26.196.242:4850/gitbucket/git/y.mizogami/vue-search-parts.git
```
## 使い方
```html
  <search-parts ref="sp" :searches="searches"><search-parts>
```
```js
  let SearchParts = require('vue-search-parts')
  let vueModel = new Vue({
    /*略*/
    data:{
      searches:[
        {
          field:'some_fielda',
          caption:'ある項目A',
          type:'text'
          like:true,
          label:true
        },
        {
          field:'select_field',
          caption:'選択式フィールド',
          type:'select'
          list:[
            {value:'A', caption:'データA'},
            {value:'B', caption:'データB'},
            {value:'C', caption:'データC'}
          ],
          label:true,
          unselectLabel:'未選択'
        },
        {
          field:'some_date_field',
          type:'date',
          caption:'工事日',
          label:true
        },
        {
          field:'some_unique_field',
          type:'multi-text',
          caption:'オーダIDとか',
          label:true
        },
        {
          field:'null_or_not_field',
          caption:'NULLまたはNotNULLを選択する項目',
          type:'null_or_not',
          nullcaption:'入力なし',
          notnullcaption:'入力あり',
          label:true
        }
      ]
    },
    getSearchCondition(){
      let where = this.$refs.sp.getCondition()
      Sql.q('some_table')
        .where(where).select()
        .then(rs=>{
          console.log(rs)
        })
    }
  })
```
## 共通パラメータ
* type {string} 検索タイプ 'text | multi-text | date | select | multi-select | null-or-not'
* field {string} 検索対象フィールド名
* caption {string} 検索項目論理名(placeholderとなる)
* def {string} デフォルト値
* label {Boolean} turu/falseでcaptionをlabel表示にする
* unselectLabel {string} 選択ボックス未選択時の表示(デフォルトは'-')
* onchange {function} - 値が変わった時に変わった値を引数に与えて呼び出されるコールバック関数
### Type "text"
単一の文字列検索

### Type "multi-text"
行で入力される複数検索

### Type "date"
日付のfrom to 検索  
* onchange {function} from,toがコールバックの二つの引数として渡される

### Type "select" "multi-select"
選択ボックスによる検索
multi-selectは複数選択可能
valueとcaptionを持つリストを与える
* def {object} 選択される値はオブジェクト型となるので、デフォルトを設定したい場合、以下のようにする
```js
  data:{
    let def = {value:'def', caption:'デフォルト'}
    return {
      searches:[
        {
          type:'select',
          field:'some_select_field',
          def:def,
          list:[
            def,
            {value:'second', caption:'二つ目'}
          ]
        }
      ]
    }
  }
  /*version >= 1.0.4 インデックスで指定可能に multi-selectの場合Numberの配列で指定*/
  data:{
    return {
      searches:[
        {
          type:'select',
          field:'some_select_field',
          def:0,
          list:[
            {value:'def', caption:'デフォルト'},
            {value:'second', caption:'二つ目'}
          ]
        }
      ]
    }
  }
```

### Type "null-or-not"
NULL値 または NULL値以外 を選択する検索  
* nullcaption {string} NULLを選択するプルダウン表示値
* notnullcaption {string} NULL以外を選択するプルダウン表示値

* complex {string} サブクエリなどの複雑なSQLを直接設定可能。 文字列 フィールド名を${field} 選択された値を ${value} でそれぞれプレースホルダとして使える
* onchange {function} 選択されたリストオブジェクトが渡される
```js
  data:{
    return {
      searches:[
        {
          type:'select',
          field:'some_select_field',
          list:[
            {value:'a', caption:'Adata'},
            {value:'b', caption:'Bdata'}
          ],
          complex:"EXISTS(SELECT id FROM child_tbl WHERE parent_tbl.id = child_tbl.parent_id AND child_tbl.${field} = '${value}'"
        }
      ]
    }
  }
```

## Demo
[Demo](http://10.26.196.242:4850/gitbucket/y.mizogami/vue-search-parts/blob/master/test/index.html?raw=true)