Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    count: 0,
    curId: 0,
    items: []
  },
  mutations: {
    add: (state, item) => {
      item.id = state.curId++;
      state.items.push(item);
    },
    del: (state, id) => {
      const i = state.items.map(item => item.id).indexOf(id);
      state.items.splice(i, 1);
    }
  }
})

var app = new Vue({
  el: '#app',
  data() {
    return {
      searchQuery: '',
      fullItems: [],
      items: [],
      promoDiscont: -100,
    }
  },
  watch: {
    async searchQuery(searchQuery) {
      if (!searchQuery) {
        this.items = this.fullItems;
      } else {
        this.items = this.fullItems.filter(item => 
          item.nameRU.toLowerCase().match(searchQuery.toLowerCase()) || item.nameEN.toLowerCase().match(searchQuery.toLowerCase())
        );
      }
    }
  },
  computed: {
    hasNotItems() {
      return Object.keys(this.fullItems).length === 0;
    },
    count() {
	    return store.state.items.length;
    },
    selectedItems() {
      return store.state.items;
    },
    totalPrice() {
      total = 0;
      allPrice = store.state.items.map(item => item.discont || item.price);
      if (allPrice.length) {
        total = allPrice.reduce((a,b) => a + b);
        total += this.promoDiscont;
        if (total < 0) {
          total = 0;
        }
      }      
      return total;
    }
  },
  methods: {
    add(item) {
      store.commit('add', item);
    },
    del(item) {
      store.commit('del', item.id);
    }
  },
  mounted() {
    let self = this;
    axios.get("https://avalonbot.teso.world/crown/item/")
      .then(response => {
        self.fullItems = response.data;
        self.items = self.fullItems;
      })
      .catch(error => {
        console.log(error);
      });
    // setTimeout(() => {
    // this.fullItems = []
    // this.items = this.fullItems
    // }, 1000);
  }
})