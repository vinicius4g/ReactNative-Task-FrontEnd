import React, { Component } from 'react'
import { 
    ImageBackground, 
    Text, 
    StyleSheet, 
    View, 
    TouchableOpacity,   
    Alert
} from 'react-native'

import axios from 'axios' 
import AsyncStorage from '@react-native-community/async-storage'

import backgroundImage from '../../assets/imgs/login.jpg'
import commonStyles from '../commonStyles'
import AuthInput from '../components/AuthInput'

import { server, showError, showSuccess } from '../common'

const initialState = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    stageNew: false
}

export default class Auth extends Component {

    state = {...initialState}

    signinOrSignup = () => {
        if(this.state.stageNew){
            this.signup()
        }
        else {
            this.signin()
        }
    }

    signup = async () => {
        try {
            await axios.post(`${server}/signup`, { //primeiro parametro é a url com caminho relativo, segundo é os dados que vao ser mandados pro backend que ira cadastrar um novo usuario
                name: this.state.name,
                email: this.state.email,
                password: this.state.password,
                confirmPassword: this.state.confirmPassword,
            })

            showSuccess('Usuario Cadastrado')
            this.setState({ ...initialState }) //limpando os inputs depois do cadastro
            
        }
        catch(e){
            showError(e)
        }
    }

    signin = async () => {
        try{
            const res = await axios.post(`${server}/signin`, {
                email: this.state.email,
                password: this.state.password
            })
            
            AsyncStorage.setItem('userData', JSON.stringify(res.data)) //quando o usuario logar vai ser inserido no async storage a informacao que vem do backend(nome, email, token)
            axios.defaults.headers.common['Authorization'] = `bearer ${res.data.token}` //essa string esta sendo setada no header Authorization, que sera mandada em qualquer nova requisicao
            this.props.navigation.navigate('Home', res.data)
        }
        catch(e) {
            showError(e)
        }
    }

    render(){
        const validations = []
        validations.push(this.state.email && this.state.email.includes('@'))
        validations.push(this.state.password && this.state.password.length >=6)

        if(this.state.stageNew) {
            validations.push(this.state.name && this.state.name.trim().length >= 3)
            validations.push(this.state.confirmPassword === this.state.password)
        }

        const validForm = validations.reduce((total, atual) => total && atual) //conferindo se todos os valores do validations sao verdadeiros, o formulario so vai ser valido se retornarem somente verdadeiro

        return (
            <ImageBackground source={backgroundImage} style={styles.background}>
                <Text style={styles.title}>Tasks</Text>
                <View style={styles.formContainer}>
                    <Text style={styles.subTitle}>
                        {this.state.stageNew ? 'Crie sua conta' : 'Informe seus dados'}
                    </Text>
                    {this.state.stageNew &&
                        <AuthInput icon='user'
                            placeholder='Nome' 
                            value={this.state.name} 
                            style={styles.input}
                            onChangeText={name => this.setState({ name })} //poderia ser escrito ({email : email}), setando o novo valor
                        />
                    }
                    <AuthInput icon='at'
                        placeholder='Email' 
                        value={this.state.email} 
                        style={styles.input}
                        onChangeText={email => this.setState({ email })} 
                    />
                     <AuthInput icon='lock' 
                        placeholder='Senha' 
                        value={this.state.password} 
                        style={styles.input}
                        secureTextEntry={true}
                        onChangeText={password => this.setState({ password })} //quando o estado é atualizado o componente é renderezidao novamente
                    />
                    {this.state.stageNew &&
                        <AuthInput icon='asterisk'
                            placeholder='Confirme a senha' 
                            value={this.state.confirmPassword} 
                            style={styles.input}
                            secureTextEntry={true}
                            onChangeText={confirmPassword => this.setState({ confirmPassword })} //
                        />
                    }
                    <TouchableOpacity 
                        onPress={this.signinOrSignup}
                        disabled={!validForm} //desabilitando o formulario caso seja invalido
                    >
                        <View style={[styles.button, validForm ? {} : {backgroundColor: '#AAA'} ]}>
                            <Text style={styles.buttonText}>
                            {this.state.stageNew ? 'Cadastrar' : 'Entrar' }
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={{ padding: 10 }} 
                    onPress={
                        () => this.setState({ stageNew: !this.state.stageNew }) //alternando o valor do estado(tela de cadastro ou login)
                    }
                >
                    <Text style={styles.buttonText}>
                        {this.state.stageNew ? 'Já possui conta?' : 'Ainda não possui conta?' }
                    </Text>
                </TouchableOpacity>
            </ImageBackground>
        )
    }
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        fontFamily: commonStyles.fontFamily,
        color: commonStyles.colors.secondary,
        fontSize: 70,
        marginBottom: 10
    },
    subTitle: {
        fontFamily: commonStyles.fontFamily,
        color: '#FFF',
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 10
    },
    formContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 20,
        width: '90%',
    },
    input: {
        marginTop: 10,
        backgroundColor: '#FFF',
    },
    button: {
        backgroundColor: '#080',
        marginTop: 10,
        padding: 10,
        alignItems: 'center',
        borderRadius: 7
    },
    buttonText: {
        fontFamily: commonStyles.fontFamily,
        color: '#FFF',
        fontSize: 20
    },

})