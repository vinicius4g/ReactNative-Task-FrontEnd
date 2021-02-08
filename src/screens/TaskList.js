import React, { Component } from 'react'
import { 
    View, 
    Text, 
    ImageBackground, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Platform,
    Alert, 
} from 'react-native'

import AsyncStorage from '@react-native-community/async-storage'
import Icon from 'react-native-vector-icons/FontAwesome'
import axios from 'axios'

import moment from 'moment'
import 'moment/locale/pt-br'

import { server, showError, showSuccess } from '../common'
import commonStyles from '../commonStyles'

import todayImage from '../../assets/imgs/today.jpg'
import tomorrowImage from '../../assets/imgs/tomorrow.jpg'
import weekImage from '../../assets/imgs/week.jpg'
import monthImage from '../../assets/imgs/month.jpg'

import Task from '../components/Task'
import AddTask from './AddTask'

const initialState = { 
    showDoneTasks: true,
    showAddTaskModal: false,
    visibleTasks: [],
    tasks: []   
}

export default class TaskList extends Component {
    state = {
        ...initialState   
    }
    
    //ciclo de vida 
    //assim que o componente for montado ele chama esse metodo de ciclo de vida
    componentDidMount = async () => {
        const stateString = await AsyncStorage.getItem('tasksState')
        const savedState = JSON.parse(stateString) || initialState
        this.setState({
            showDoneTasks: savedState.showDoneTasks
        }, this.filterTasks)
        
        this.loadTasks()
    }

    //funcao responsavel por carregar as tasks
    loadTasks = async () => {
        try {
            const maxDate = moment()
                .add({ days: this.props.daysAhead}) //adicionar o objeto dias a frente
                .format('YYYY-MM-DD 23:59:59') //.format gera uma data que o sql espera receber que é ano/mes/dia, nessa caso foi adicionado horas pra usar no maximo a data de hoje ate 23:59:59
            const res = await axios.get(`${server}/tasks?date=${maxDate}`)
            this.setState({ tasks: res.data }, this.filterTasks) //res.data é exatamente o que servidor retornou, nesse caso foram as listas das tasks obtidas no banco de dados
        }
        catch(e) {
            showError(e)
        }
    }
    
    //essa funcao ira inverter o valor de estado do showDoneTasks sempre que for chamada
    toggleFilter = () => {
        this.setState({ showDoneTasks: !this.state.showDoneTasks },  this.filterTasks) //passando uma callback depois que o estado for atualizado
    }

    //funcao para mostar ou nao as tasks. (com arrow function o this sempre vai apontar pro componente atual)
    filterTasks = () => {
        let visibleTasks = null
        
        //se o a showDoneTasks for verdadeiro é clonado o array tasks
        if(this.state.showDoneTasks) {
            visibleTasks = [...this.state.tasks]
        }
        else {
            //verifica se task esta pendente, e retorna true ou false
            const pendding = task => task.doneAt === null
            //na linha abaixo filtra somente as tasks pendentes
            visibleTasks = this.state.tasks.filter(pendding)
        }

        //abaixo muda o valor do estado 
        this.setState({ visibleTasks }) // outra forma de implementar seria visibleTasks: visibleTasks
        AsyncStorage.setItem('tasksState', JSON.stringify({
            showDoneTasks: this.state.showDoneTasks
        }))
    }

    toggleTask = async taskId => {
       try {
           await axios.put(`${server}/tasks/${taskId}/toggle`)
           this.loadTasks()

       }
       catch(e) {
           showError(e)
       }
    }

    //funcao ira adicionar uma nova tasks dentro do estado da aplicacao
    addTask = async newTask => {
        if( !newTask.desc || !newTask.desc.trim() ) {
            Alert.alert('Dados Inválidos', 'Descrição não informada !')
            return
        }

        try {
            await axios.post(`${server}/tasks`,{    //inserindo a task no backend
                desc: newTask.desc,                 
                estimateAt: newTask.date
            })

            this.setState({ showAddTaskModal: false }, this.loadTasks) //seta os valores e esconde o modal, e atualizada todas as taks visiveis
        }
        catch(e) {
            showError(e)
        }
        
    }

    
    deleteTask = async taskId => {
        try {
            await axios.delete(`${server}/tasks/${taskId}`)
            this.loadTasks()
        }
        catch(e) {
            showError(e)
        }
    }

    getImage = () => {
        switch(this.props.daysAhead) {
            case 0: return todayImage
            case 1: return tomorrowImage
            case 7: return weekImage
            default: return monthImage
        }
    }

    getColor = () => {
        switch(this.props.daysAhead) {
            case 0: return commonStyles.colors.today
            case 1: return commonStyles.colors.tomorrow
            case 7: return commonStyles.colors.week
            default: return commonStyles.colors.month
        }
    }

    render() {
        const today = moment().locale('pt-br').format('ddd, D [de] MMMM')
        return (
            <View style={styles.container}>
                <AddTask 
                    isVisible={this.state.showAddTaskModal} 
                    onCancel={() => this.setState({ showAddTaskModal: false })} 
                    onSave={this.addTask}
                />
                <ImageBackground style={styles.background} source={this.getImage()}>
                    <View style={styles.iconBar}>
                        <TouchableOpacity onPress={() => this.props.navigation.openDrawer() }>
                            <Icon name='bars' size={20} color={commonStyles.colors.secondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={this.toggleFilter}>
                            <Icon name={this.state.showDoneTasks ? 'eye' : 'eye-slash' } size={20} color={commonStyles.colors.secondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.titleBar}>
                        <Text style={styles.title}>{this.props.title}</Text>
                        <Text style={styles.subTitle}>{today}</Text>
                    </View>
                </ImageBackground>
                <View style={styles.taskList}>
                   <FlatList data={this.state.visibleTasks}
                        keyExtractor={item => `${item.id}`}
                        renderItem={({item}) => <Task {...item} onToggleTask={this.toggleTask} onDelete={this.deleteTask}/>} //chamando a funcao para alterar o estado
                   />
                </View>   
                <TouchableOpacity 
                    style={[ styles.addButton, {backgroundColor: this.getColor()} ]}
                    activeOpacity={0.7}
                    onPress={ () => this.setState({ showAddTaskModal: true})}
                >
                    <Icon 
                        name="plus"
                        size={20}
                        color={commonStyles.colors.secondary}
                    />
                </TouchableOpacity>          
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    background: {
        flex: 3
    },
    taskList: {
        flex: 7
    },
    titleBar: {
        flex: 1,
        justifyContent: 'flex-end'
    },
    title: {
        fontFamily: commonStyles.fontFamily,
        color: commonStyles.colors.secondary,
        fontSize: 50,
        marginLeft: 20,
        marginBottom: 10
    },
    subTitle: {
        fontFamily: commonStyles.fontFamily,
        color: commonStyles.colors.secondary,
        fontSize: 20,
        marginLeft: 20,
        marginBottom: 30
    },
    iconBar: {
        flexDirection: 'row',
        marginHorizontal: 20,
        justifyContent: 'space-between',
        marginTop: Platform.OS === 'ios' ? 40 : 10
    },
    addButton: {
        position: 'absolute',
        right: 30,
        bottom: 30,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center'
    }

})