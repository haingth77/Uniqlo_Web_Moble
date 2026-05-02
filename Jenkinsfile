pipeline {
    agent any

    parameters {
        choice(
            name: 'ENVIRONMENT',
            choices: ['QA', 'Staging'],
            description: 'Select environment to run tests against'
        )
        choice(
            name: 'BROWSER',
            choices: ['chromium', 'firefox', 'webkit', 'All Browsers'],
            description: 'Select browser (choose "All Browsers" to run on all 3 browsers)'
        )
    }

    environment {
        BASE_URL = "${params.ENVIRONMENT == 'QA' ? 'https://www.uniqlo.com/uk/en/' : 'https://www.uniqlo.com/vn/en/'}"
        BROWSER  = "${params.BROWSER == 'All Browsers' ? 'all' : params.BROWSER}"
    }

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Run Tests') {
            steps {
                echo "Environment: ${params.ENVIRONMENT} | URL: ${env.BASE_URL} | Browser: ${params.BROWSER}"
                sh 'docker compose up --abort-on-container-exit --exit-code-from playwright-tests'
            }
            post {
                always {
                    publishHTML(target: [
                        reportName : "Playwright - ${params.ENVIRONMENT} - ${params.BROWSER}",
                        reportDir  : 'playwright-report',
                        reportFiles: 'index.html',
                        keepAll    : true,
                        alwaysLinkToLastBuild: true
                    ])
                    archiveArtifacts(
                        artifacts        : 'playwright-report/**/*,test-results/**/*',
                        allowEmptyArchive: true
                    )
                }
            }
        }
    }

    post {
        always {
            sh 'docker compose down --volumes'
        }
        success {
            echo "PASSED on ${params.ENVIRONMENT} (${params.BROWSER})"
        }
        failure {
            echo "FAILED on ${params.ENVIRONMENT} (${params.BROWSER}) — check Playwright report above"
        }
    }
}
