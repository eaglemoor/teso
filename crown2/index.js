Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    items: [],
    totalCrown: {
      Title: "Total (👑)",
      Description: "",
      Price: 0
    },
    totalGold: {
      Title: "Total (💰)",
      Description: "",
      Price: 0
    }
  },
  mutations: {
    del({ items }, id) {
      const i = items.map(item => item.id).indexOf(id);
      items.splice(i, 1);
    },
    
    updateItems(state, items) {
      state.items.splice(0, state.items.length, ...items);
      curId = 0
      state.items.forEach(element => element.id = curId++);
    },

    updateTotalCrown(state, totalCrown) {
      state.totalCrown = totalCrown;
    },

    updateTotalGold(state, totalGold) {
      state.totalGold = totalGold;
    }
  },
  actions: {
    async update({ commit }, keys) {
      const newPost = {
        fromUserID: 'EagleMoor',
        toUserID: 'Kaba4ok',
        items: keys,
      };
      const resp = await axios.post('https://avalonbot.teso.world/crown/basket/', newPost);
      commit("updateItems", resp.data.items);
      commit("updateTotalCrown", resp.data.totalCrown);
      commit("updateTotalGold", resp.data.totalGold);
    },

    async add({ dispatch, state }, key) {      
      keys = [...state.items.map(item => item.key), key];
      try {
        dispatch("update", keys);
      } catch (err) {
        console.error(err);
      } 
    },

    async del({ dispatch, state }, id) {
      keys = state.items.map(item => item.key);
      keys.splice(id, 1);
      try {
        dispatch("update", keys);
      } catch (err) {
        console.error(err);
      } 
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
    totalCrown() {
      return store.state.totalCrown;
    },
    totalGold() {
      return store.state.totalGold;
    }
  },
  methods: {
    add(key) {
      store.dispatch('add', key); 
    },
    del(item) {
      store.dispatch('del', item.id);
    }
  },
  async mounted() {
    try {
      const response = await axios.get("https://avalonbot.teso.world/crown/item/");
      this.fullItems = this.items = response.data;
    } catch (err) {
      console.error(err);
    }
    // setTimeout(() => {
    // this.items = this.fullItems = []
    // }, 1000);
  }
})